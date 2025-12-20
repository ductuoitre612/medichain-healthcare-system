module medichain_healthcare::prescription {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::event;
    use std::vector;
    use medichain_healthcare::doctor::DoctorCapability;

    // ============ Errors ============
    const EInvalidPrescriptionData: u64 = 1;
    const EUnauthorizedDoctor: u64 = 2;
    const EDoctorNotActive: u64 = 3;
    const EEmptyMedicineList: u64 = 4;
    const EPrescriptionExpired: u64 = 5;
    const EAlreadyDispensed: u64 = 6;

    // ============ Structs ============
    
    /// Medicine - Thông tin thuốc trong đơn
    public struct Medicine has store, drop, copy {
        medicine_name: String,              // Tên thuốc
        dosage: String,                     // Liều lượng (e.g., "500mg")
        quantity: u64,                      // Số lượng
        frequency: String,                  // Tần suất (e.g., "2 lần/ngày")
        duration: String,                   // Thời gian dùng (e.g., "7 ngày")
        instructions: String,               // Hướng dẫn sử dụng
        notes: String,                      // Ghi chú đặc biệt
    }

    /// Prescription - Đơn thuốc điện tử (IMMUTABLE)
    /// Một khi tạo rồi thì KHÔNG THỂ sửa đổi
    /// Owner: Bệnh nhân nhận đơn thuốc
    public struct Prescription has key {
        id: UID,
        prescription_id: String,            // Mã đơn thuốc
        patient_id: String,                 // Mã bệnh nhân
        patient_address: address,           // Địa chỉ ví bệnh nhân
        patient_name: String,               // Tên bệnh nhân
        doctor_id: String,                  // Mã bác sĩ
        doctor_address: address,            // Địa chỉ ví bác sĩ
        doctor_name: String,                // Tên bác sĩ
        doctor_specialty: String,           // Chuyên khoa bác sĩ
        diagnosis: String,                  // Chẩn đoán
        medicines: vector<Medicine>,        // Danh sách thuốc
        created_date: u64,                  // Timestamp tạo đơn
        expiry_date: u64,                   // Hạn sử dụng đơn (timestamp)
        notes: String,                      // Lời dặn của bác sĩ
        is_dispensed: bool,                 // Đã cấp phát thuốc chưa
        dispensed_date: u64,                // Ngày cấp phát (0 nếu chưa)
        dispensed_by: address,              // Nhà thuốc cấp phát (0x0 nếu chưa)
    }

    // ============ Events ============
    
    /// Event khi kê đơn thuốc
    public struct PrescriptionCreated has copy, drop {
        prescription_id: String,
        prescription_object_id: address,
        patient_id: String,
        patient_address: address,
        doctor_id: String,
        doctor_address: address,
        medicine_count: u64,
        created_date: u64,
        expiry_date: u64,
    }

    /// Event khi cấp phát thuốc
    public struct PrescriptionDispensed has copy, drop {
        prescription_id: String,
        prescription_object_id: address,
        patient_address: address,
        dispensed_by: address,
        dispensed_date: u64,
    }

    /// Event khi xác minh đơn thuốc
    public struct PrescriptionVerified has copy, drop {
        prescription_id: String,
        verified_by: address,
        timestamp: u64,
        is_valid: bool,
    }

    // ============ Public Functions ============
    
    /// Kê đơn thuốc mới
    /// CHỈ bác sĩ có DoctorCapability mới kê được
    /// Đơn thuốc là IMMUTABLE - không thể sửa sau khi tạo
    public fun create_prescription(
        capability: &DoctorCapability,
        prescription_id: String,
        patient_id: String,
        patient_address: address,
        patient_name: String,
        diagnosis: String,
        medicines: vector<Medicine>,
        expiry_days: u64,                   // Số ngày đơn thuốc có hiệu lực
        notes: String,
        ctx: &mut TxContext
    ) {
        // Validate
        assert!(!std::string::is_empty(&prescription_id), EInvalidPrescriptionData);
        assert!(!std::string::is_empty(&patient_id), EInvalidPrescriptionData);
        assert!(!vector::is_empty(&medicines), EEmptyMedicineList);
        
        // Kiểm tra capability
        assert!(medichain_healthcare::doctor::capability_is_active(capability), EDoctorNotActive);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let expiry_date = timestamp + (expiry_days * 24 * 60 * 60 * 1000); // Convert days to milliseconds
        
        let doctor_address = medichain_healthcare::doctor::capability_get_doctor_address(capability);
        let doctor_id = medichain_healthcare::doctor::capability_get_doctor_id(capability);
        let doctor_specialty = medichain_healthcare::doctor::capability_get_specialty(capability);
        
        // Tạo Prescription object (IMMUTABLE)
        let prescription = Prescription {
            id: object::new(ctx),
            prescription_id,
            patient_id,
            patient_address,
            patient_name,
            doctor_id,
            doctor_address,
            doctor_name: std::string::utf8(b""), // Sẽ lấy từ Doctor object trong thực tế
            doctor_specialty,
            diagnosis,
            medicines,
            created_date: timestamp,
            expiry_date,
            notes,
            is_dispensed: false,
            dispensed_date: 0,
            dispensed_by: @0x0,
        };
        
        let prescription_object_id = object::uid_to_address(&prescription.id);
        let medicine_count = vector::length(&prescription.medicines);
        
        // Emit event
        event::emit(PrescriptionCreated {
            prescription_id: prescription.prescription_id,
            prescription_object_id,
            patient_id: prescription.patient_id,
            patient_address,
            doctor_id: prescription.doctor_id,
            doctor_address,
            medicine_count,
            created_date: timestamp,
            expiry_date,
        });
        
        // Transfer cho bệnh nhân (bệnh nhân là owner)
        transfer::transfer(prescription, patient_address);
    }

    /// Cấp phát thuốc theo đơn
    /// CHỈ nhà thuốc có PharmacyCapability mới gọi được
    /// (Trong version đơn giản này, chấp nhận bất kỳ ai gọi)
    public fun dispense_prescription(
        prescription: &mut Prescription,
        ctx: &mut TxContext
    ) {
        // Kiểm tra chưa cấp phát
        assert!(!prescription.is_dispensed, EAlreadyDispensed);
        
        // Kiểm tra chưa hết hạn
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        assert!(current_time <= prescription.expiry_date, EPrescriptionExpired);
        
        // Cập nhật trạng thái
        prescription.is_dispensed = true;
        prescription.dispensed_date = current_time;
        prescription.dispensed_by = tx_context::sender(ctx);
        
        // Emit event
        event::emit(PrescriptionDispensed {
            prescription_id: prescription.prescription_id,
            prescription_object_id: object::uid_to_address(&prescription.id),
            patient_address: prescription.patient_address,
            dispensed_by: tx_context::sender(ctx),
            dispensed_date: current_time,
        });
    }

    /// Xác minh đơn thuốc (verify)
    /// Bất kỳ ai cũng có thể xác minh tính hợp lệ
    public fun verify_prescription(
        prescription: &Prescription,
        ctx: &mut TxContext
    ) {
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let is_valid = current_time <= prescription.expiry_date && !prescription.is_dispensed;
        
        event::emit(PrescriptionVerified {
            prescription_id: prescription.prescription_id,
            verified_by: tx_context::sender(ctx),
            timestamp: current_time,
            is_valid,
        });
    }

    // ============ Helper Functions ============
    
    /// Tạo Medicine struct (helper function)
    public fun create_medicine(
        medicine_name: String,
        dosage: String,
        quantity: u64,
        frequency: String,
        duration: String,
        instructions: String,
        notes: String,
    ): Medicine {
        Medicine {
            medicine_name,
            dosage,
            quantity,
            frequency,
            duration,
            instructions,
            notes,
        }
    }

    /// Kiểm tra đơn thuốc có hợp lệ không
    public fun is_valid(prescription: &Prescription, current_time: u64): bool {
        current_time <= prescription.expiry_date && !prescription.is_dispensed
    }

    /// Kiểm tra đã hết hạn chưa
    public fun is_expired(prescription: &Prescription, current_time: u64): bool {
        current_time > prescription.expiry_date
    }

    // ============ Getter Functions ============
    
    public fun get_prescription_id(prescription: &Prescription): String {
        prescription.prescription_id
    }

    public fun get_patient_id(prescription: &Prescription): String {
        prescription.patient_id
    }

    public fun get_patient_address(prescription: &Prescription): address {
        prescription.patient_address
    }

    public fun get_patient_name(prescription: &Prescription): String {
        prescription.patient_name
    }

    public fun get_doctor_id(prescription: &Prescription): String {
        prescription.doctor_id
    }

    public fun get_doctor_address(prescription: &Prescription): address {
        prescription.doctor_address
    }

    public fun get_doctor_name(prescription: &Prescription): String {
        prescription.doctor_name
    }

    public fun get_diagnosis(prescription: &Prescription): String {
        prescription.diagnosis
    }

    public fun get_medicines(prescription: &Prescription): &vector<Medicine> {
        &prescription.medicines
    }

    public fun get_created_date(prescription: &Prescription): u64 {
        prescription.created_date
    }

    public fun get_expiry_date(prescription: &Prescription): u64 {
        prescription.expiry_date
    }

    public fun get_notes(prescription: &Prescription): String {
        prescription.notes
    }

    public fun is_dispensed(prescription: &Prescription): bool {
        prescription.is_dispensed
    }

    public fun get_dispensed_date(prescription: &Prescription): u64 {
        prescription.dispensed_date
    }

    public fun get_dispensed_by(prescription: &Prescription): address {
        prescription.dispensed_by
    }

    // Medicine getters
    public fun medicine_get_name(medicine: &Medicine): String {
        medicine.medicine_name
    }

    public fun medicine_get_dosage(medicine: &Medicine): String {
        medicine.dosage
    }

    public fun medicine_get_quantity(medicine: &Medicine): u64 {
        medicine.quantity
    }

    public fun medicine_get_frequency(medicine: &Medicine): String {
        medicine.frequency
    }

    public fun medicine_get_duration(medicine: &Medicine): String {
        medicine.duration
    }

    public fun medicine_get_instructions(medicine: &Medicine): String {
        medicine.instructions
    }

    // ============ Test Functions ============
    
    #[test_only]
    public fun create_prescription_for_testing(
        prescription_id: String,
        patient_id: String,
        patient_address: address,
        ctx: &mut TxContext
    ): Prescription {
        let medicines = vector::empty<Medicine>();
        vector::push_back(&mut medicines, Medicine {
            medicine_name: std::string::utf8(b"Paracetamol"),
            dosage: std::string::utf8(b"500mg"),
            quantity: 20,
            frequency: std::string::utf8(b"2 times/day"),
            duration: std::string::utf8(b"7 days"),
            instructions: std::string::utf8(b"After meals"),
            notes: std::string::utf8(b""),
        });
        
        Prescription {
            id: object::new(ctx),
            prescription_id,
            patient_id,
            patient_address,
            patient_name: std::string::utf8(b"Test Patient"),
            doctor_id: std::string::utf8(b"D001"),
            doctor_address: tx_context::sender(ctx),
            doctor_name: std::string::utf8(b"Test Doctor"),
            doctor_specialty: std::string::utf8(b"General"),
            diagnosis: std::string::utf8(b"Test diagnosis"),
            medicines,
            created_date: 0,
            expiry_date: 999999999999,
            notes: std::string::utf8(b"Test notes"),
            is_dispensed: false,
            dispensed_date: 0,
            dispensed_by: @0x0,
        }
    }
}