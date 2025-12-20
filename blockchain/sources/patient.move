module medichain_healthcare::patient {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::event;

    // ============ Errors ============
    const EInvalidPatientData: u64 = 1;
    const EUnauthorizedAccess: u64 = 2;

    // ============ Structs ============
    
    /// Patient object - Đại diện cho một bệnh nhân
    /// Owner: Bệnh nhân sở hữu object này
    public struct Patient has key, store {
        id: UID,
        patient_id: String,
        full_name: String,
        date_of_birth: String,
        gender: String,
        id_number: String,
        phone: String,
        email: String,
        address: String,
        blood_type: String,
        allergies: String,
        emergency_contact: String,
        registration_date: u64,
        wallet_address: address,
    }

    /// PatientRegistry - Capability để đăng ký bệnh nhân mới
    public struct PatientRegistry has key, store {
        id: UID,
        admin_address: address,
    }

    // ============ Events ============
    
    /// Event khi đăng ký bệnh nhân mới
    public struct PatientRegistered has copy, drop {
        patient_id: String,
        patient_object_id: address,
        wallet_address: address,
        full_name: String,
        timestamp: u64,
    }

    /// Event khi cập nhật thông tin bệnh nhân
    public struct PatientUpdated has copy, drop {
        patient_id: String,
        patient_object_id: address,
        updated_by: address,
        timestamp: u64,
    }

    // ============ Init Function ============
    
    fun init(ctx: &mut TxContext) {
        let registry = PatientRegistry {
            id: object::new(ctx),
            admin_address: tx_context::sender(ctx),
        };
        transfer::public_transfer(registry, tx_context::sender(ctx));
    }

    // ============ Public Functions ============
    
    public fun register_patient(
        _registry: &PatientRegistry,
        patient_id: String,
        full_name: String,
        date_of_birth: String,
        gender: String,
        id_number: String,
        phone: String,
        email: String,
        address: String,
        blood_type: String,
        allergies: String,
        emergency_contact: String,
        patient_wallet: address,
        ctx: &mut TxContext
    ) {
        assert!(!std::string::is_empty(&patient_id), EInvalidPatientData);
        assert!(!std::string::is_empty(&full_name), EInvalidPatientData);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        let patient = Patient {
            id: object::new(ctx),
            patient_id,
            full_name,
            date_of_birth,
            gender,
            id_number,
            phone,
            email,
            address,
            blood_type,
            allergies,
            emergency_contact,
            registration_date: timestamp,
            wallet_address: patient_wallet,
        };
        
        let patient_object_id = object::uid_to_address(&patient.id);
        
        event::emit(PatientRegistered {
            patient_id: patient.patient_id,
            patient_object_id,
            wallet_address: patient_wallet,
            full_name: patient.full_name,
            timestamp,
        });
        
        transfer::public_transfer(patient, patient_wallet);
    }

    public fun update_patient_info(
        patient: &mut Patient,
        phone: String,
        email: String,
        address: String,
        emergency_contact: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == patient.wallet_address, EUnauthorizedAccess);
        
        patient.phone = phone;
        patient.email = email;
        patient.address = address;
        patient.emergency_contact = emergency_contact;
        
        event::emit(PatientUpdated {
            patient_id: patient.patient_id,
            patient_object_id: object::uid_to_address(&patient.id),
            updated_by: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    public fun update_medical_info(
        patient: &mut Patient,
        blood_type: String,
        allergies: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == patient.wallet_address, EUnauthorizedAccess);
        
        patient.blood_type = blood_type;
        patient.allergies = allergies;
        
        event::emit(PatientUpdated {
            patient_id: patient.patient_id,
            patient_object_id: object::uid_to_address(&patient.id),
            updated_by: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // ============ Getter Functions ============
    
    public fun get_patient_id(patient: &Patient): String {
        patient.patient_id
    }

    public fun get_full_name(patient: &Patient): String {
        patient.full_name
    }

    public fun get_date_of_birth(patient: &Patient): String {
        patient.date_of_birth
    }

    public fun get_gender(patient: &Patient): String {
        patient.gender
    }

    public fun get_phone(patient: &Patient): String {
        patient.phone
    }

    public fun get_email(patient: &Patient): String {
        patient.email
    }

    public fun get_wallet_address(patient: &Patient): address {
        patient.wallet_address
    }

    public fun get_blood_type(patient: &Patient): String {
        patient.blood_type
    }

    public fun get_allergies(patient: &Patient): String {
        patient.allergies
    }

    // ============ Admin Functions ============
    
    public fun transfer_registry(
        registry: PatientRegistry,
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