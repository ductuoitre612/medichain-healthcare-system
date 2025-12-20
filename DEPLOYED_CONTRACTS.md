\# Deployed Contracts - Sui Testnet



\*\*Deployed Date\*\*: 2024-12-21

\*\*Network\*\*: Sui Testnet

\*\*Deployer\*\*: 0xd885e98fbbfdb1c88224f86ba64b7433f687f977ef3bde449e1ec9912f7ea359



---



\## 📦 Main Package



\*\*Package ID\*\*: 

```

0x85bc1284ba93a8aeeaedebc0d9131dbe1189bdf91aa76131ce73f5b016e2c6ec

```



\*\*Version\*\*: 1



\*\*Modules\*\*: 

\- ✅ patient

\- ✅ doctor



\### Sui Explorer:

https://suiscan.xyz/testnet/object/0x85bc1284ba93a8aeeaedebc0d9131dbe1189bdf91aa76131ce73f5b016e2c6ec



---



\## 👤 Patient Module



\### Registry Object:

```

0x0a177d13c5a97befb5c0383bcf71272d650ae5f2a5c812588778e6e2fcaf37d9

```



\### Functions:

\- ✅ register\_patient()

\- ✅ update\_patient\_info()

\- ✅ update\_medical\_info()

\- ✅ get\_patient\_id()

\- ✅ get\_full\_name()

\- ✅ transfer\_registry()



\### Events:

\- PatientRegistered

\- PatientUpdated



---



\## ⚕️ Doctor Module



\### Registry Object:

```

0x5215263fc42db3a3d251bd0897290f9f35080604887a436ae2c3d899ae24f49c1

```



\### Functions:

\- ✅ register\_doctor()

\- ✅ grant\_capability() ⭐

\- ✅ verify\_doctor()

\- ✅ deactivate\_capability()

\- ✅ update\_doctor\_info()

\- ✅ get\_doctor\_id()

\- ✅ is\_verified()



\### Events:

\- DoctorRegistered

\- CapabilityGranted ⭐

\- CapabilityRevoked

\- DoctorVerified

\- DoctorUpdated



---



\## 🎯 Next Steps



\- \[ ] Deploy medical\_record.move (EHR)

\- \[ ] Deploy prescription.move

\- \[ ] Deploy access\_control.move

\- \[ ] Test end-to-end workflow

