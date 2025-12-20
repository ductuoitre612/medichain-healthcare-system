module medichain_healthcare::medical_record {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::event;
    use sui::table::{Self, Table};
    use medichain_healthcare::doctor::DoctorCapability;

    // ============ Errors ============
    const EInvalidRecordData: u64 = 1;
    const EUnauthorizedAccess: u64 = 2;
    const EAccessAlreadyGranted: u64 = 3;
    const EAccessNotFound: u64 = 4;
    const ENotPatientOwner: u64 = 5;
    const EDoctorNotActive: u64 = 6;

    // ============ Structs ============
    
    /// MedicalRecord - Bệnh án điện tử
    /// Owner: Bệnh nhân sở hữu bệnh án của mình
    public struct MedicalRecord has key, store {
        id: UID,
        record_id: String,                  // Mã bệnh án
        patient_id: String,                 // Mã bệnh nhân
        patient_address: address,           // Địa chỉ ví bệnh nhân (owner)
        diagnosis: String,                  // Chẩn đoán
        symptoms: String,                   // Triệu chứng
        treatment_plan: String,             // Kế hoạch điều trị
        notes: String,                      // Ghi chú của bác sĩ
        ipfs_hash: String,                  // IPFS CID - Lưu dữ liệu lớn (hình ảnh, file)
        data_hash: String,                  // SHA-256 hash để verify tính toàn vẹn
        created_date: u64,                  // Timestamp tạo
        last_updated: u64,                  // Timestamp cập nhật cuối
        created_by: address,                // Bác sĩ tạo bệnh án
        // Access control
        authorized_doctors: Table<address, AccessPermission>,  // Danh sách bác sĩ được phép xem
    }

    /// AccessPermission - Quyền truy cập của bác sĩ
    public struct AccessPermission has store, drop, copy {
        doctor_address: address,
        doctor_name: String,
        granted_date: u64,
        can_read: bool,
        can_write: bool,
        expiry_date: u64,                   // 0 = không hết hạn
    }

    // ============ Events ============
    
    /// Event khi tạo bệnh án mới
    public struct RecordCreated has copy, drop {
        record_id: String,
        record_object_id: address,
        patient_id: String,
        patient_address: address,
        created_by: address,
        ipfs_hash: String,
        timestamp: u64,
    }

    /// Event khi cập nhật bệnh án
    public struct RecordUpdated has copy, drop {
        record_id: String,
        record_object_id: address,
        updated_by: address,
        ipfs_hash: String,
        timestamp: u64,
    }

    /// Event khi cấp quyền truy cập
    public struct AccessGranted has copy, drop {
        record_id: String,
        patient_address: address,
        doctor_address: address,
        can_read: bool,
        can_write: bool,
        granted_date: u64,
    }

    /// Event khi thu hồi quyền
    public struct AccessRevoked has copy, drop {
        record_id: String,
        patient_address: address,
        doctor_address: address,
        revoked_date: u64,
    }

    /// Event khi bác sĩ truy cập bệnh án
    public struct RecordAccessed has copy, drop {
        record_id: String,
        doctor_address: address,
        access_type: String,                // "read" hoặc "write"
        timestamp: u64,
    }

    // ============ Public Functions ============
    
    /// Tạo bệnh án mới
    /// Chỉ bác sĩ có DoctorCapability mới tạo được
    public fun create_medical_record(
        capability: &DoctorCapability,
        record_id: String,
        patient_id: String,
        patient_address: address,
        diagnosis: String,
        symptoms: String,
        treatment_plan: String,
        notes: String,
        ipfs_hash: String,
        data_hash: String,
        ctx: &mut TxContext
    ) {
        // Validate
        assert!(!std::string::is_empty(&record_id), EInvalidRecordData);
        assert!(!std::string::is_empty(&patient_id), EInvalidRecordData);
        
        // Kiểm tra capability còn active
        assert!(medichain_healthcare::doctor::capability_is_active(capability), EDoctorNotActive);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let doctor_address = medichain_healthcare::doctor::capability_get_doctor_address(capability);
        
        // Tạo bảng authorized_doctors rỗng
        let authorized_doctors = table::new<address, AccessPermission>(ctx);
        
        // Tạo MedicalRecord object
        let record = MedicalRecord {
            id: object::new(ctx),
            record_id,
            patient_id,
            patient_address,
            diagnosis,
            symptoms,
            treatment_plan,
            notes,
            ipfs_hash,
            data_hash,
            created_date: timestamp,
            last_updated: timestamp,
            created_by: doctor_address,
            authorized_doctors,
        };
        
        let record_object_id = object::uid_to_address(&record.id);
        
        // Emit event
        event::emit(RecordCreated {
            record_id: record.record_id,
            record_object_id,
            patient_id: record.patient_id,
            patient_address,
            created_by: doctor_address,
            ipfs_hash: record.ipfs_hash,
            timestamp,
        });
        
        // Transfer cho bệnh nhân (bệnh nhân là owner)
        transfer::public_transfer(record, patient_address);
    }

    /// Cập nhật bệnh án
    /// Chỉ bác sĩ được cấp quyền write mới cập nhật được
    public fun update_medical_record(
        record: &mut MedicalRecord,
        capability: &DoctorCapability,
        diagnosis: String,
        symptoms: String,
        treatment_plan: String,
        notes: String,
        ipfs_hash: String,
        data_hash: String,
        ctx: &mut TxContext
    ) {
        let doctor_address = medichain_healthcare::doctor::capability_get_doctor_address(capability);
        
        // Kiểm tra quyền
        assert!(has_write_access(record, doctor_address), EUnauthorizedAccess);
        assert!(medichain_healthcare::doctor::capability_is_active(capability), EDoctorNotActive);
        
        // Cập nhật
        record.diagnosis = diagnosis;
        record.symptoms = symptoms;
        record.treatment_plan = treatment_plan;
        record.notes = notes;
        record.ipfs_hash = ipfs_hash;
        record.data_hash = data_hash;
        record.last_updated = tx_context::epoch_timestamp_ms(ctx);
        
        // Emit event
        event::emit(RecordUpdated {
            record_id: record.record_id,
            record_object_id: object::uid_to_address(&record.id),
            updated_by: doctor_address,
            ipfs_hash: record.ipfs_hash,
            timestamp: record.last_updated,
        });
        
        // Log access
        event::emit(RecordAccessed {
            record_id: record.record_id,
            doctor_address,
            access_type: std::string::utf8(b"write"),
            timestamp: record.last_updated,
        });
    }

    /// Cấp quyền truy cập cho bác sĩ
    /// Chỉ bệnh nhân (owner) mới cấp quyền được
    public fun grant_access(
        record: &mut MedicalRecord,
        doctor_address: address,
        doctor_name: String,
        can_read: bool,
        can_write: bool,
        expiry_date: u64,
        ctx: &mut TxContext
    ) {
        // Kiểm tra người gọi có phải owner không
        assert!(tx_context::sender(ctx) == record.patient_address, ENotPatientOwner);
        
        // Kiểm tra chưa cấp quyền cho bác sĩ này
        assert!(!table::contains(&record.authorized_doctors, doctor_address), EAccessAlreadyGranted);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        // Tạo permission
        let permission = AccessPermission {
            doctor_address,
            doctor_name,
            granted_date: timestamp,
            can_read,
            can_write,
            expiry_date,
        };
        
        // Thêm vào bảng
        table::add(&mut record.authorized_doctors, doctor_address, permission);
        
        // Emit event
        event::emit(AccessGranted {
            record_id: record.record_id,
            patient_address: record.patient_address,
            doctor_address,
            can_read,
            can_write,
            granted_date: timestamp,
        });
    }

    /// Thu hồi quyền truy cập
    /// Chỉ bệnh nhân (owner) mới thu hồi được
    public fun revoke_access(
        record: &mut MedicalRecord,
        doctor_address: address,
        ctx: &mut TxContext
    ) {
        // Kiểm tra quyền
        assert!(tx_context::sender(ctx) == record.patient_address, ENotPatientOwner);
        
        // Kiểm tra đã cấp quyền chưa
        assert!(table::contains(&record.authorized_doctors, doctor_address), EAccessNotFound);
        
        // Xóa khỏi bảng
        table::remove(&mut record.authorized_doctors, doctor_address);
        
        // Emit event
        event::emit(AccessRevoked {
            record_id: record.record_id,
            patient_address: record.patient_address,
            doctor_address,
            revoked_date: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Bác sĩ đọc bệnh án
    /// Chỉ log event, không trả về dữ liệu (dữ liệu lấy qua getter functions)
    public fun read_record(
        record: &MedicalRecord,
        capability: &DoctorCapability,
        ctx: &mut TxContext
    ) {
        let doctor_address = medichain_healthcare::doctor::capability_get_doctor_address(capability);
        
        // Kiểm tra quyền đọc
        assert!(has_read_access(record, doctor_address), EUnauthorizedAccess);
        assert!(medichain_healthcare::doctor::capability_is_active(capability), EDoctorNotActive);
        
        // Log access
        event::emit(RecordAccessed {
            record_id: record.record_id,
            doctor_address,
            access_type: std::string::utf8(b"read"),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // ============ Helper Functions ============
    
    /// Kiểm tra bác sĩ có quyền đọc không
    fun has_read_access(record: &MedicalRecord, doctor_address: address): bool {
        // Bác sĩ tạo bệnh án luôn có quyền đọc
        if (doctor_address == record.created_by) {
            return true
        };
        
        // Kiểm tra trong bảng authorized
        if (table::contains(&record.authorized_doctors, doctor_address)) {
            let permission = table::borrow(&record.authorized_doctors, doctor_address);
            permission.can_read
        } else {
            false
        }
    }

    /// Kiểm tra bác sĩ có quyền ghi không
    fun has_write_access(record: &MedicalRecord, doctor_address: address): bool {
        // Bác sĩ tạo bệnh án luôn có quyền ghi
        if (doctor_address == record.created_by) {
            return true
        };
        
        // Kiểm tra trong bảng authorized
        if (table::contains(&record.authorized_doctors, doctor_address)) {
            let permission = table::borrow(&record.authorized_doctors, doctor_address);
            permission.can_write
        } else {
            false
        }
    }

    // ============ Getter Functions ============
    
    public fun get_record_id(record: &MedicalRecord): String {
        record.record_id
    }

    public fun get_patient_id(record: &MedicalRecord): String {
        record.patient_id
    }

    public fun get_patient_address(record: &MedicalRecord): address {
        record.patient_address
    }

    public fun get_diagnosis(record: &MedicalRecord): String {
        record.diagnosis
    }

    public fun get_symptoms(record: &MedicalRecord): String {
        record.symptoms
    }

    public fun get_treatment_plan(record: &MedicalRecord): String {
        record.treatment_plan
    }

    public fun get_notes(record: &MedicalRecord): String {
        record.notes
    }

    public fun get_ipfs_hash(record: &MedicalRecord): String {
        record.ipfs_hash
    }

    public fun get_data_hash(record: &MedicalRecord): String {
        record.data_hash
    }

    public fun get_created_date(record: &MedicalRecord): u64 {
        record.created_date
    }

    public fun get_last_updated(record: &MedicalRecord): u64 {
        record.last_updated
    }

    public fun get_created_by(record: &MedicalRecord): address {
        record.created_by
    }

    // ============ Test Functions ============
    
    #[test_only]
    public fun create_record_for_testing(
        record_id: String,
        patient_id: String,
        patient_address: address,
        ctx: &mut TxContext
    ): MedicalRecord {
        MedicalRecord {
            id: object::new(ctx),
            record_id,
            patient_id,
            patient_address,
            diagnosis: std::string::utf8(b"Test diagnosis"),
            symptoms: std::string::utf8(b"Test symptoms"),
            treatment_plan: std::string::utf8(b"Test plan"),
            notes: std::string::utf8(b"Test notes"),
            ipfs_hash: std::string::utf8(b"QmTest123"),
            data_hash: std::string::utf8(b"hash123"),
            created_date: 0,
            last_updated: 0,
            created_by: tx_context::sender(ctx),
            authorized_doctors: table::new<address, AccessPermission>(ctx),
        }
    }
}