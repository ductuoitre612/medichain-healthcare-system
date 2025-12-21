module medichain_healthcare::access_control {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::event;
    use sui::table::{Self, Table};

    // ============ Errors ============
    const EUnauthorizedAccess: u64 = 1;
    const EInvalidRole: u64 = 2;
    const EPermissionNotFound: u64 = 3;
    const EPermissionAlreadyExists: u64 = 4;

    // ============ Constants - Roles ============
    const ROLE_ADMIN: u8 = 0;
    const ROLE_DOCTOR: u8 = 1;
    const ROLE_PATIENT: u8 = 2;
    const ROLE_PHARMACY: u8 = 3;
    const ROLE_NURSE: u8 = 4;

    // ============ Constants - Permissions ============
    const PERM_READ_PATIENT: u8 = 0;
    const PERM_WRITE_PATIENT: u8 = 1;
    const PERM_READ_EHR: u8 = 2;
    const PERM_WRITE_EHR: u8 = 3;
    const PERM_CREATE_PRESCRIPTION: u8 = 4;
    const PERM_DISPENSE_PRESCRIPTION: u8 = 5;
    const PERM_GRANT_ACCESS: u8 = 6;
    const PERM_REVOKE_ACCESS: u8 = 7;
    const PERM_MANAGE_DOCTORS: u8 = 8;
    const PERM_MANAGE_PHARMACY: u8 = 9;

    // ============ Structs ============
    
    /// AccessControlRegistry - Quản lý tất cả quyền truy cập
    /// Chỉ có 1 instance duy nhất cho toàn hệ thống
    public struct AccessControlRegistry has key {
        id: UID,
        admin_address: address,
        // Role của từng user
        user_roles: Table<address, Role>,
        // Permissions của từng role
        role_permissions: Table<u8, RolePermissions>,
    }

    /// Role - Vai trò của user
    public struct Role has store, drop, copy {
        user_address: address,
        role_type: u8,                      // ROLE_ADMIN, ROLE_DOCTOR, etc.
        role_name: String,
        granted_date: u64,
        is_active: bool,
    }

    /// RolePermissions - Danh sách quyền của một role
    public struct RolePermissions has store, drop, copy {
        role_type: u8,
        permissions: vector<u8>,            // List of permission IDs
    }

    /// AuditLog - Nhật ký truy cập
    public struct AuditLog has key, store {
        id: UID,
        user_address: address,
        action: String,                     // "read", "write", "grant", "revoke"
        resource_type: String,              // "patient", "ehr", "prescription"
        resource_id: String,
        timestamp: u64,
        success: bool,
        error_message: String,
    }

    // ============ Events ============
    
    /// Event khi cấp role
    public struct RoleGranted has copy, drop {
        user_address: address,
        role_type: u8,
        role_name: String,
        granted_by: address,
        timestamp: u64,
    }

    /// Event khi thu hồi role
    public struct RoleRevoked has copy, drop {
        user_address: address,
        role_type: u8,
        revoked_by: address,
        timestamp: u64,
    }

    /// Event khi truy cập tài nguyên
    public struct ResourceAccessed has copy, drop {
        user_address: address,
        resource_type: String,
        resource_id: String,
        action: String,
        timestamp: u64,
    }

    /// Event khi vi phạm quyền truy cập
    public struct AccessViolation has copy, drop {
        user_address: address,
        attempted_action: String,
        resource_type: String,
        timestamp: u64,
    }

    // ============ Init Function ============
    
    fun init(ctx: &mut TxContext) {
        let registry = AccessControlRegistry {
            id: object::new(ctx),
            admin_address: tx_context::sender(ctx),
            user_roles: table::new<address, Role>(ctx),
            role_permissions: table::new<u8, RolePermissions>(ctx),
        };
        
        // Khởi tạo permissions cho từng role
        init_default_permissions(&mut registry, ctx);
        
        // Cấp role ADMIN cho người deploy
        grant_admin_role(&mut registry, tx_context::sender(ctx), ctx);
        
        // Share registry để mọi người đều truy cập được
        transfer::share_object(registry);
    }

    // ============ Public Functions ============
    
    /// Cấp role cho user
    /// Chỉ admin mới gọi được
    public fun grant_role(
        registry: &mut AccessControlRegistry,
        user_address: address,
        role_type: u8,
        role_name: String,
        ctx: &mut TxContext
    ) {
        // Kiểm tra quyền admin
        assert!(tx_context::sender(ctx) == registry.admin_address, EUnauthorizedAccess);
        
        // Validate role type
        assert!(role_type <= ROLE_NURSE, EInvalidRole);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        let role = Role {
            user_address,
            role_type,
            role_name,
            granted_date: timestamp,
            is_active: true,
        };
        
        // Add hoặc update role
        if (table::contains(&registry.user_roles, user_address)) {
            table::remove(&mut registry.user_roles, user_address);
        };
        table::add(&mut registry.user_roles, user_address, role);
        
        // Emit event
        event::emit(RoleGranted {
            user_address,
            role_type,
            role_name,
            granted_by: tx_context::sender(ctx),
            timestamp,
        });
    }

    /// Thu hồi role
    public fun revoke_role(
        registry: &mut AccessControlRegistry,
        user_address: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin_address, EUnauthorizedAccess);
        assert!(table::contains(&registry.user_roles, user_address), EPermissionNotFound);
        
        let role = table::remove(&mut registry.user_roles, user_address);
        
        event::emit(RoleRevoked {
            user_address,
            role_type: role.role_type,
            revoked_by: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Kiểm tra user có quyền không
    public fun has_permission(
        registry: &AccessControlRegistry,
        user_address: address,
        permission: u8
    ): bool {
        // Kiểm tra có role không
        if (!table::contains(&registry.user_roles, user_address)) {
            return false
        };
        
        let role = table::borrow(&registry.user_roles, user_address);
        
        // Kiểm tra role còn active không
        if (!role.is_active) {
            return false
        };
        
        // Admin có tất cả quyền
        if (role.role_type == ROLE_ADMIN) {
            return true
        };
        
        // Kiểm tra permissions của role
        if (table::contains(&registry.role_permissions, role.role_type)) {
            let role_perms = table::borrow(&registry.role_permissions, role.role_type);
            vector::contains(&role_perms.permissions, &permission)
        } else {
            false
        }
    }

    /// Log truy cập
    public fun log_access(
        user_address: address,
        action: String,
        resource_type: String,
        resource_id: String,
        success: bool,
        error_message: String,
        ctx: &mut TxContext
    ) {
        let log = AuditLog {
            id: object::new(ctx),
            user_address,
            action,
            resource_type,
            resource_id,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            success,
            error_message,
        };
        
        // Emit event
        event::emit(ResourceAccessed {
            user_address,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            action: log.action,
            timestamp: log.timestamp,
        });
        
        // Transfer log về admin để quản lý
        transfer::public_transfer(log, user_address);
    }

    /// Log vi phạm quyền
    public fun log_violation(
        user_address: address,
        attempted_action: String,
        resource_type: String,
        ctx: &mut TxContext
    ) {
        event::emit(AccessViolation {
            user_address,
            attempted_action,
            resource_type,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // ============ Helper Functions ============
    
    /// Khởi tạo permissions mặc định cho các roles
    fun init_default_permissions(registry: &mut AccessControlRegistry, ctx: &mut TxContext) {
        // Admin: tất cả quyền
        let mut admin_perms = vector::empty<u8>();
        vector::push_back(&mut admin_perms, PERM_READ_PATIENT);
        vector::push_back(&mut admin_perms, PERM_WRITE_PATIENT);
        vector::push_back(&mut admin_perms, PERM_READ_EHR);
        vector::push_back(&mut admin_perms, PERM_WRITE_EHR);
        vector::push_back(&mut admin_perms, PERM_CREATE_PRESCRIPTION);
        vector::push_back(&mut admin_perms, PERM_DISPENSE_PRESCRIPTION);
        vector::push_back(&mut admin_perms, PERM_GRANT_ACCESS);
        vector::push_back(&mut admin_perms, PERM_REVOKE_ACCESS);
        vector::push_back(&mut admin_perms, PERM_MANAGE_DOCTORS);
        vector::push_back(&mut admin_perms, PERM_MANAGE_PHARMACY);
        
        table::add(&mut registry.role_permissions, ROLE_ADMIN, RolePermissions {
            role_type: ROLE_ADMIN,
            permissions: admin_perms,
        });
        
        // Doctor: đọc/ghi bệnh án, kê đơn
        let mut doctor_perms = vector::empty<u8>();
        vector::push_back(&mut doctor_perms, PERM_READ_PATIENT);
        vector::push_back(&mut doctor_perms, PERM_READ_EHR);
        vector::push_back(&mut doctor_perms, PERM_WRITE_EHR);
        vector::push_back(&mut doctor_perms, PERM_CREATE_PRESCRIPTION);
        
        table::add(&mut registry.role_permissions, ROLE_DOCTOR, RolePermissions {
            role_type: ROLE_DOCTOR,
            permissions: doctor_perms,
        });
        
        // Patient: đọc dữ liệu của mình, cấp/thu hồi quyền
        let mut patient_perms = vector::empty<u8>();
        vector::push_back(&mut patient_perms, PERM_READ_PATIENT);
        vector::push_back(&mut patient_perms, PERM_READ_EHR);
        vector::push_back(&mut patient_perms, PERM_GRANT_ACCESS);
        vector::push_back(&mut patient_perms, PERM_REVOKE_ACCESS);
        
        table::add(&mut registry.role_permissions, ROLE_PATIENT, RolePermissions {
            role_type: ROLE_PATIENT,
            permissions: patient_perms,
        });
        
        // Pharmacy: cấp phát thuốc
        let mut pharmacy_perms = vector::empty<u8>();
        vector::push_back(&mut pharmacy_perms, PERM_DISPENSE_PRESCRIPTION);
        
        table::add(&mut registry.role_permissions, ROLE_PHARMACY, RolePermissions {
            role_type: ROLE_PHARMACY,
            permissions: pharmacy_perms,
        });
        
        // Nurse: đọc bệnh án
        let mut nurse_perms = vector::empty<u8>();
        vector::push_back(&mut nurse_perms, PERM_READ_PATIENT);
        vector::push_back(&mut nurse_perms, PERM_READ_EHR);
        
        table::add(&mut registry.role_permissions, ROLE_NURSE, RolePermissions {
            role_type: ROLE_NURSE,
            permissions: nurse_perms,
        });
    }

    /// Cấp role admin cho user
    fun grant_admin_role(registry: &mut AccessControlRegistry, user_address: address, ctx: &mut TxContext) {
        let role = Role {
            user_address,
            role_type: ROLE_ADMIN,
            role_name: std::string::utf8(b"Administrator"),
            granted_date: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };
        
        table::add(&mut registry.user_roles, user_address, role);
    }

    // ============ Getter Functions ============
    
    public fun get_user_role(registry: &AccessControlRegistry, user_address: address): Option<Role> {
        if (table::contains(&registry.user_roles, user_address)) {
            option::some(*table::borrow(&registry.user_roles, user_address))
        } else {
            option::none()
        }
    }

    public fun is_admin(registry: &AccessControlRegistry, user_address: address): bool {
        if (table::contains(&registry.user_roles, user_address)) {
            let role = table::borrow(&registry.user_roles, user_address);
            role.role_type == ROLE_ADMIN && role.is_active
        } else {
            false
        }
    }

    public fun is_doctor(registry: &AccessControlRegistry, user_address: address): bool {
        if (table::contains(&registry.user_roles, user_address)) {
            let role = table::borrow(&registry.user_roles, user_address);
            role.role_type == ROLE_DOCTOR && role.is_active
        } else {
            false
        }
    }

    public fun is_patient(registry: &AccessControlRegistry, user_address: address): bool {
        if (table::contains(&registry.user_roles, user_address)) {
            let role = table::borrow(&registry.user_roles, user_address);
            role.role_type == ROLE_PATIENT && role.is_active
        } else {
            false
        }
    }

    public fun is_pharmacy(registry: &AccessControlRegistry, user_address: address): bool {
        if (table::contains(&registry.user_roles, user_address)) {
            let role = table::borrow(&registry.user_roles, user_address);
            role.role_type == ROLE_PHARMACY && role.is_active
        } else {
            false
        }
    }

    // ============ Permission Constants Getters ============
    
    public fun perm_read_patient(): u8 { PERM_READ_PATIENT }
    public fun perm_write_patient(): u8 { PERM_WRITE_PATIENT }
    public fun perm_read_ehr(): u8 { PERM_READ_EHR }
    public fun perm_write_ehr(): u8 { PERM_WRITE_EHR }
    public fun perm_create_prescription(): u8 { PERM_CREATE_PRESCRIPTION }
    public fun perm_dispense_prescription(): u8 { PERM_DISPENSE_PRESCRIPTION }
    public fun perm_grant_access(): u8 { PERM_GRANT_ACCESS }
    public fun perm_revoke_access(): u8 { PERM_REVOKE_ACCESS }

    // ============ Test Functions ============
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
