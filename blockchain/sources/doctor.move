module medichain_healthcare::doctor {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::event;

    // ============ Errors ============
    const EInvalidDoctorData: u64 = 1;
    const EUnauthorizedAccess: u64 = 2;
    const ECapabilityAlreadyGranted: u64 = 3;
    const EInvalidLicense: u64 = 4;

    // ============ Structs ============
    
    /// Doctor object - Thông tin bác sĩ
    /// Owner: Bác sĩ sở hữu object này
    public struct Doctor has key, store {
        id: UID,
        doctor_id: String,              // Mã bác sĩ
        full_name: String,              // Họ và tên
        specialty: String,              // Chuyên khoa (e.g., "Cardiology", "Pediatrics")
        license_number: String,         // Số chứng chỉ hành nghề
        hospital: String,               // Bệnh viện/Phòng khám
        phone: String,                  // Số điện thoại
        email: String,                  // Email
        years_of_experience: u64,       // Số năm kinh nghiệm
        registration_date: u64,         // Timestamp đăng ký
        wallet_address: address,        // Địa chỉ ví Sui
        is_verified: bool,              // Đã xác minh chưa
        is_active: bool,                // Trạng thái hoạt động
    }

    /// DoctorRegistry - Capability để đăng ký bác sĩ mới
    /// Chỉ admin y tế có capability này
    public struct DoctorRegistry has key, store {
        id: UID,
        admin_address: address,
    }

    /// DoctorCapability - Quyền hạn của bác sĩ
    /// Bác sĩ cần capability này để:
    /// - Xem bệnh án (nếu được bệnh nhân cấp quyền)
    /// - Kê đơn thuốc
    /// - Cập nhật hồ sơ y tế
    public struct DoctorCapability has key, store {
        id: UID,
        doctor_id: String,
        doctor_address: address,
        specialty: String,
        granted_date: u64,
        is_active: bool,
    }

    // ============ Events ============
    
    /// Event khi đăng ký bác sĩ mới
    public struct DoctorRegistered has copy, drop {
        doctor_id: String,
        doctor_object_id: address,
        wallet_address: address,
        full_name: String,
        specialty: String,
        timestamp: u64,
    }

    /// Event khi cấp capability cho bác sĩ
    public struct CapabilityGranted has copy, drop {
        doctor_id: String,
        capability_object_id: address,
        doctor_address: address,
        specialty: String,
        timestamp: u64,
    }

    /// Event khi thu hồi capability
    public struct CapabilityRevoked has copy, drop {
        doctor_id: String,
        doctor_address: address,
        timestamp: u64,
    }

    /// Event khi cập nhật thông tin bác sĩ
    public struct DoctorUpdated has copy, drop {
        doctor_id: String,
        doctor_object_id: address,
        updated_by: address,
        timestamp: u64,
    }

    /// Event khi xác minh bác sĩ
    public struct DoctorVerified has copy, drop {
        doctor_id: String,
        verified_by: address,
        timestamp: u64,
    }

    // ============ Init Function ============
    
    fun init(ctx: &mut TxContext) {
        let registry = DoctorRegistry {
            id: object::new(ctx),
            admin_address: tx_context::sender(ctx),
        };
        transfer::public_transfer(registry, tx_context::sender(ctx));
    }

    // ============ Public Functions ============
    
    /// Đăng ký bác sĩ mới
    /// Chỉ người có DoctorRegistry capability mới gọi được
    public fun register_doctor(
        _registry: &DoctorRegistry,
        doctor_id: String,
        full_name: String,
        specialty: String,
        license_number: String,
        hospital: String,
        phone: String,
        email: String,
        years_of_experience: u64,
        doctor_wallet: address,
        ctx: &mut TxContext
    ) {
        // Validate
        assert!(!std::string::is_empty(&doctor_id), EInvalidDoctorData);
        assert!(!std::string::is_empty(&full_name), EInvalidDoctorData);
        assert!(!std::string::is_empty(&license_number), EInvalidLicense);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        // Tạo Doctor object
        let doctor = Doctor {
            id: object::new(ctx),
            doctor_id,
            full_name,
            specialty,
            license_number,
            hospital,
            phone,
            email,
            years_of_experience,
            registration_date: timestamp,
            wallet_address: doctor_wallet,
            is_verified: false,  // Chưa xác minh
            is_active: true,
        };
        
        let doctor_object_id = object::uid_to_address(&doctor.id);
        
        // Emit event
        event::emit(DoctorRegistered {
            doctor_id: doctor.doctor_id,
            doctor_object_id,
            wallet_address: doctor_wallet,
            full_name: doctor.full_name,
            specialty: doctor.specialty,
            timestamp,
        });
        
        // Transfer cho bác sĩ
        transfer::public_transfer(doctor, doctor_wallet);
    }

    /// Cấp DoctorCapability cho bác sĩ đã xác minh
    /// Chỉ admin (người có DoctorRegistry) mới gọi được
    public fun grant_capability(
        _registry: &DoctorRegistry,
        doctor: &Doctor,
        ctx: &mut TxContext
    ) {
        // Kiểm tra bác sĩ đã được xác minh
        assert!(doctor.is_verified, EUnauthorizedAccess);
        assert!(doctor.is_active, EUnauthorizedAccess);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        // Tạo Capability
        let capability = DoctorCapability {
            id: object::new(ctx),
            doctor_id: doctor.doctor_id,
            doctor_address: doctor.wallet_address,
            specialty: doctor.specialty,
            granted_date: timestamp,
            is_active: true,
        };
        
        let capability_object_id = object::uid_to_address(&capability.id);
        
        // Emit event
        event::emit(CapabilityGranted {
            doctor_id: doctor.doctor_id,
            capability_object_id,
            doctor_address: doctor.wallet_address,
            specialty: doctor.specialty,
            timestamp,
        });
        
        // Transfer capability cho bác sĩ
        transfer::public_transfer(capability, doctor.wallet_address);
    }

    /// Xác minh bác sĩ (verify)
    /// Chỉ admin mới gọi được
    public fun verify_doctor(
        _registry: &DoctorRegistry,
        doctor: &mut Doctor,
        ctx: &mut TxContext
    ) {
        doctor.is_verified = true;
        
        event::emit(DoctorVerified {
            doctor_id: doctor.doctor_id,
            verified_by: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Vô hiệu hóa capability (thu hồi quyền)
    public fun deactivate_capability(
        capability: &mut DoctorCapability,
        ctx: &mut TxContext
    ) {
        capability.is_active = false;
        
        event::emit(CapabilityRevoked {
            doctor_id: capability.doctor_id,
            doctor_address: capability.doctor_address,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Kích hoạt lại capability
    public fun activate_capability(
        capability: &mut DoctorCapability,
        _ctx: &mut TxContext
    ) {
        capability.is_active = true;
    }

    /// Cập nhật thông tin bác sĩ
    /// Chỉ owner (bác sĩ) mới cập nhật được
    public fun update_doctor_info(
        doctor: &mut Doctor,
        phone: String,
        email: String,
        hospital: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == doctor.wallet_address, EUnauthorizedAccess);
        
        doctor.phone = phone;
        doctor.email = email;
        doctor.hospital = hospital;
        
        event::emit(DoctorUpdated {
            doctor_id: doctor.doctor_id,
            doctor_object_id: object::uid_to_address(&doctor.id),
            updated_by: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Vô hiệu hóa bác sĩ (deactivate)
    /// Chỉ admin hoặc chính bác sĩ mới làm được
    public fun deactivate_doctor(
        _registry: &DoctorRegistry,
        doctor: &mut Doctor,
        _ctx: &mut TxContext
    ) {
        doctor.is_active = false;
    }

    /// Kích hoạt lại bác sĩ
    public fun activate_doctor(
        _registry: &DoctorRegistry,
        doctor: &mut Doctor,
        _ctx: &mut TxContext
    ) {
        doctor.is_active = true;
    }

    // ============ Getter Functions ============
    
    public fun get_doctor_id(doctor: &Doctor): String {
        doctor.doctor_id
    }

    public fun get_full_name(doctor: &Doctor): String {
        doctor.full_name
    }

    public fun get_specialty(doctor: &Doctor): String {
        doctor.specialty
    }

    public fun get_license_number(doctor: &Doctor): String {
        doctor.license_number
    }

    public fun get_hospital(doctor: &Doctor): String {
        doctor.hospital
    }

    public fun get_wallet_address(doctor: &Doctor): address {
        doctor.wallet_address
    }

    public fun is_verified(doctor: &Doctor): bool {
        doctor.is_verified
    }

    public fun is_active(doctor: &Doctor): bool {
        doctor.is_active
    }

    public fun get_years_of_experience(doctor: &Doctor): u64 {
        doctor.years_of_experience
    }

    // Capability getters
    public fun capability_is_active(capability: &DoctorCapability): bool {
        capability.is_active
    }

    public fun capability_get_doctor_id(capability: &DoctorCapability): String {
        capability.doctor_id
    }

    public fun capability_get_doctor_address(capability: &DoctorCapability): address {
        capability.doctor_address
    }

    public fun capability_get_specialty(capability: &DoctorCapability): String {
        capability.specialty
    }

    // ============ Admin Functions ============
    
    /// Transfer DoctorRegistry cho admin mới
    public fun transfer_registry(
        registry: DoctorRegistry,
        new_admin: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(registry, new_admin);
    }

    // ============ Test Functions ============
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}