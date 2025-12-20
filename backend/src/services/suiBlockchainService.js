import suiClient, { PACKAGE_IDS, MODULES } from "../config/sui.js";
import { TransactionBlock } from "@mysten/sui.js/transactions";

class SuiBlockchainService {
  // ===== PATIENT FUNCTIONS =====

  /**
   * Đăng ký bệnh nhân mới trên blockchain
   * @param {Object} patientData - Thông tin bệnh nhân
   * @param {string} signerAddress - Địa chỉ ví của người đăng ký
   * @returns {Object} Transaction result
   */
  async registerPatient(patientData, signerAddress) {
    try {
      const tx = new TransactionBlock();

      // Lấy Registry object (shared object)
      const registryId = await this.getPatientRegistry();

      // Gọi function register_patient
      tx.moveCall({
        target: `${PACKAGE_IDS.patient}::${MODULES.patient}::register_patient`,
        arguments: [
          tx.object(registryId),
          tx.pure.string(patientData.patientId),
          tx.pure.string(patientData.name),
          tx.pure.string(patientData.dateOfBirth),
          tx.pure.string(patientData.gender),
          tx.pure.string(patientData.bloodType),
          tx.pure.string(patientData.phone),
          tx.pure.string(patientData.email),
          tx.pure.string(patientData.address),
          tx.pure.string(patientData.emergencyContact),
          tx.pure.string(patientData.allergies || ""),
          tx.pure.string(patientData.medicalHistory || ""),
        ],
      });

      return {
        transactionBlock: tx,
        message: "Transaction block created successfully",
      };
    } catch (error) {
      console.error("❌ Error creating patient transaction:", error);
      throw new Error(`Failed to create patient transaction: ${error.message}`);
    }
  }

  /**
   * Cập nhật thông tin bệnh nhân
   */
  async updatePatient(patientObjectId, updateData, signerAddress) {
    try {
      const tx = new TransactionBlock();

      tx.moveCall({
        target: `${PACKAGE_IDS.patient}::${MODULES.patient}::update_patient`,
        arguments: [
          tx.object(patientObjectId),
          tx.pure.string(updateData.phone),
          tx.pure.string(updateData.email),
          tx.pure.string(updateData.address),
          tx.pure.string(updateData.emergencyContact),
          tx.pure.string(updateData.allergies || ""),
          tx.pure.string(updateData.medicalHistory || ""),
        ],
      });

      return {
        transactionBlock: tx,
        message: "Update transaction created successfully",
      };
    } catch (error) {
      console.error("❌ Error updating patient:", error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin bệnh nhân từ blockchain
   */
  async getPatient(objectId) {
    try {
      const object = await suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (!object.data) {
        throw new Error("Patient object not found");
      }

      return object.data;
    } catch (error) {
      console.error("❌ Error fetching patient:", error);
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả objects thuộc sở hữu của một địa chỉ
   */
  async getObjectsByOwner(ownerAddress) {
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: ownerAddress,
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data;
    } catch (error) {
      console.error("❌ Error fetching owned objects:", error);
      throw new Error(`Failed to fetch owned objects: ${error.message}`);
    }
  }

  /**
   * Lấy PatientRegistry shared object
   */
  async getPatientRegistry() {
    try {
      // Query để tìm PatientRegistry object
      const packageObjects = await suiClient.getOwnedObjects({
        owner: PACKAGE_IDS.patient,
        options: {
          showType: true,
          showContent: true,
        },
      });

      // Tìm object có type là PatientRegistry
      const registry = packageObjects.data.find((obj) =>
        obj.data?.type?.includes("PatientRegistry")
      );

      if (!registry) {
        throw new Error("PatientRegistry not found");
      }

      return registry.data.objectId;
    } catch (error) {
      console.error("❌ Error fetching registry:", error);
      throw new Error(`Failed to fetch registry: ${error.message}`);
    }
  }

  // ===== PRESCRIPTION FUNCTIONS =====

  /**
   * Tạo đơn thuốc mới
   */
  async createPrescription(prescriptionData, doctorCapObjectId, clockObjectId) {
    try {
      const tx = new TransactionBlock();

      const registryId = await this.getPrescriptionRegistry();

      tx.moveCall({
        target: `${PACKAGE_IDS.prescription}::${MODULES.prescription}::create_prescription`,
        arguments: [
          tx.object(registryId),
          tx.object(doctorCapObjectId),
          tx.pure.string(prescriptionData.prescriptionId),
          tx.pure.string(prescriptionData.patientId),
          tx.pure.address(prescriptionData.patientAddress),
          tx.pure.string(prescriptionData.diagnosis),
          tx.pure.string(JSON.stringify(prescriptionData.medications)),
          tx.pure.string(prescriptionData.dosageInstructions),
          tx.pure.string(prescriptionData.notes),
          tx.pure.u64(prescriptionData.expiryDays),
          tx.pure.u8(prescriptionData.refillsAllowed),
          tx.object(clockObjectId), // Sui Clock object: 0x6
        ],
      });

      return {
        transactionBlock: tx,
        message: "Prescription transaction created",
      };
    } catch (error) {
      console.error("❌ Error creating prescription:", error);
      throw new Error(`Failed to create prescription: ${error.message}`);
    }
  }

  /**
   * Phát thuốc
   */
  async dispensePrescription(
    prescriptionObjectId,
    pharmacyCapObjectId,
    clockObjectId
  ) {
    try {
      const tx = new TransactionBlock();

      const registryId = await this.getPrescriptionRegistry();

      tx.moveCall({
        target: `${PACKAGE_IDS.prescription}::${MODULES.prescription}::dispense_prescription`,
        arguments: [
          tx.object(registryId),
          tx.object(prescriptionObjectId),
          tx.object(pharmacyCapObjectId),
          tx.object(clockObjectId), // 0x6
        ],
      });

      return {
        transactionBlock: tx,
        message: "Dispense transaction created",
      };
    } catch (error) {
      console.error("❌ Error dispensing prescription:", error);
      throw new Error(`Failed to dispense prescription: ${error.message}`);
    }
  }

  /**
   * Lấy PrescriptionRegistry
   */
  async getPrescriptionRegistry() {
    try {
      const packageObjects = await suiClient.getOwnedObjects({
        owner: PACKAGE_IDS.prescription,
        options: {
          showType: true,
        },
      });

      const registry = packageObjects.data.find((obj) =>
        obj.data?.type?.includes("PrescriptionRegistry")
      );

      if (!registry) {
        throw new Error("PrescriptionRegistry not found");
      }

      return registry.data.objectId;
    } catch (error) {
      console.error("❌ Error fetching prescription registry:", error);
      throw new Error(
        `Failed to fetch prescription registry: ${error.message}`
      );
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Lấy transaction details
   */
  async getTransaction(digest) {
    try {
      const tx = await suiClient.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
          showObjectChanges: true,
        },
      });

      return tx;
    } catch (error) {
      console.error("❌ Error fetching transaction:", error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * Lấy balance của địa chỉ
   */
  async getBalance(address) {
    try {
      const balance = await suiClient.getBalance({
        owner: address,
      });

      return balance;
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Parse events từ transaction
   */
  parseEvents(transaction) {
    try {
      if (!transaction.events || transaction.events.length === 0) {
        return [];
      }

      return transaction.events.map((event) => ({
        type: event.type,
        data: event.parsedJson,
        timestamp: event.timestampMs,
      }));
    } catch (error) {
      console.error("❌ Error parsing events:", error);
      return [];
    }
  }
}

export default new SuiBlockchainService();
