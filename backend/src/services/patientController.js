import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";
import suiBlockchainService from "../services/suiBlockchainService.js";

/**
 * @desc    Tạo transaction để đăng ký bệnh nhân mới
 * @route   POST /api/patients/register
 * @access  Public
 */
export const registerPatient = asyncHandler(async (req, res) => {
  const {
    walletAddress,
    patientId,
    name,
    dateOfBirth,
    gender,
    bloodType,
    phone,
    email,
    address,
    emergencyContact,
    allergies,
    medicalHistory,
  } = req.body;

  // Validate required fields
  if (!walletAddress || !patientId || !name || !dateOfBirth) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Kiểm tra patient đã tồn tại chưa
  const existingPatient = await Patient.findOne({
    $or: [{ patientId }, { walletAddress }, { email }],
  });

  if (existingPatient) {
    res.status(400);
    throw new Error("Patient with this ID, wallet, or email already exists");
  }

  // Tạo transaction block để đăng ký trên blockchain
  const patientData = {
    patientId,
    name,
    dateOfBirth,
    gender,
    bloodType,
    phone,
    email,
    address,
    emergencyContact,
    allergies: allergies || "",
    medicalHistory: medicalHistory || "",
  };

  const result = await suiBlockchainService.registerPatient(
    patientData,
    walletAddress
  );

  res.status(200).json({
    success: true,
    message: "Transaction created. Please sign with your wallet.",
    data: {
      transactionBlock: result.transactionBlock.serialize(),
      patientData,
    },
  });
});

/**
 * @desc    Lưu thông tin bệnh nhân sau khi transaction thành công
 * @route   POST /api/patients/confirm
 * @access  Public
 */
export const confirmPatientRegistration = asyncHandler(async (req, res) => {
  const { transactionDigest, walletAddress, patientData } = req.body;

  if (!transactionDigest || !walletAddress) {
    res.status(400);
    throw new Error("Transaction digest and wallet address are required");
  }

  // Lấy transaction details từ blockchain
  const transaction = await suiBlockchainService.getTransaction(
    transactionDigest
  );

  if (!transaction) {
    res.status(400);
    throw new Error("Transaction not found");
  }

  // Parse events để lấy object ID
  const events = suiBlockchainService.parseEvents(transaction);
  const patientCreatedEvent = events.find((e) =>
    e.type.includes("PatientCreated")
  );

  if (!patientCreatedEvent) {
    res.status(400);
    throw new Error("Patient creation event not found");
  }

  // Lấy object ID từ transaction changes
  const objectChanges = transaction.objectChanges || [];
  const createdObject = objectChanges.find(
    (change) =>
      change.type === "created" && change.objectType.includes("Patient")
  );

  if (!createdObject) {
    res.status(400);
    throw new Error("Created patient object not found");
  }

  // Lưu vào MongoDB
  const patient = await Patient.create({
    suiObjectId: createdObject.objectId,
    walletAddress,
    patientId: patientData.patientId,
    name: patientData.name,
    dateOfBirth: patientData.dateOfBirth,
    gender: patientData.gender,
    bloodType: patientData.bloodType,
    phone: patientData.phone,
    email: patientData.email,
    address: patientData.address,
    emergencyContact: patientData.emergencyContact,
    allergies: patientData.allergies || "",
    medicalHistory: patientData.medicalHistory || "",
    isVerified: true,
  });

  res.status(201).json({
    success: true,
    message: "Patient registered successfully",
    data: patient,
  });
});

/**
 * @desc    Lấy danh sách tất cả bệnh nhân
 * @route   GET /api/patients
 * @access  Private/Admin
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { patientId: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
        isActive: true,
      }
    : { isActive: true };

  const patients = await Patient.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .select("-__v");

  const count = await Patient.countDocuments(query);

  res.json({
    success: true,
    data: patients,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
    },
  });
});

/**
 * @desc    Lấy thông tin bệnh nhân theo ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Lấy thông tin từ blockchain để đảm bảo sync
  try {
    const blockchainData = await suiBlockchainService.getPatient(
      patient.suiObjectId
    );

    res.json({
      success: true,
      data: {
        ...patient.toJSON(),
        blockchainData: blockchainData.content,
      },
    });
  } catch (error) {
    // Nếu không lấy được từ blockchain, trả về data từ DB
    res.json({
      success: true,
      data: patient,
    });
  }
});

/**
 * @desc    Lấy bệnh nhân theo wallet address
 * @route   GET /api/patients/wallet/:address
 * @access  Private
 */
export const getPatientByWallet = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    walletAddress: req.params.address,
  });

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found with this wallet address");
  }

  res.json({
    success: true,
    data: patient,
  });
});

/**
 * @desc    Tạo transaction để cập nhật thông tin bệnh nhân
 * @route   PUT /api/patients/:id
 * @access  Private
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const { phone, email, address, emergencyContact, allergies, medicalHistory } =
    req.body;

  // Tạo transaction block để update trên blockchain
  const updateData = {
    phone: phone || patient.phone,
    email: email || patient.email,
    address: address || patient.address,
    emergencyContact: emergencyContact || patient.emergencyContact,
    allergies: allergies || patient.allergies,
    medicalHistory: medicalHistory || patient.medicalHistory,
  };

  const result = await suiBlockchainService.updatePatient(
    patient.suiObjectId,
    updateData,
    patient.walletAddress
  );

  res.json({
    success: true,
    message: "Update transaction created. Please sign with your wallet.",
    data: {
      transactionBlock: result.transactionBlock.serialize(),
      updateData,
    },
  });
});

/**
 * @desc    Confirm patient update sau khi transaction thành công
 * @route   POST /api/patients/:id/confirm-update
 * @access  Private
 */
export const confirmPatientUpdate = asyncHandler(async (req, res) => {
  const { transactionDigest, updateData } = req.body;
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Verify transaction
  const transaction = await suiBlockchainService.getTransaction(
    transactionDigest
  );

  if (!transaction) {
    res.status(400);
    throw new Error("Transaction not found");
  }

  // Update MongoDB
  Object.assign(patient, updateData);
  await patient.save();

  res.json({
    success: true,
    message: "Patient updated successfully",
    data: patient,
  });
});

/**
 * @desc    Xóa bệnh nhân (soft delete)
 * @route   DELETE /api/patients/:id
 * @access  Private/Admin
 */
export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  patient.isActive = false;
  await patient.save();

  res.json({
    success: true,
    message: "Patient deleted successfully",
  });
});

/**
 * @desc    Tìm kiếm bệnh nhân
 * @route   GET /api/patients/search
 * @access  Private
 */
export const searchPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error("Search query is required");
  }

  const patients = await Patient.searchPatients(q);

  res.json({
    success: true,
    count: patients.length,
    data: patients,
  });
});

/**
 * @desc    Lấy thống kê bệnh nhân
 * @route   GET /api/patients/stats
 * @access  Private/Admin
 */
export const getPatientStats = asyncHandler(async (req, res) => {
  const totalPatients = await Patient.countDocuments({ isActive: true });
  const verifiedPatients = await Patient.countDocuments({
    isActive: true,
    isVerified: true,
  });
  const todayRegistrations = await Patient.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  });

  // Gender distribution
  const genderStats = await Patient.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$gender", count: { $sum: 1 } } },
  ]);

  // Blood type distribution
  const bloodTypeStats = await Patient.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$bloodType", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalPatients,
      verifiedPatients,
      todayRegistrations,
      genderDistribution: genderStats,
      bloodTypeDistribution: bloodTypeStats,
    },
  });
});
