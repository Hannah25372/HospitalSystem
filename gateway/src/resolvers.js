'use strict';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_DIR = path.resolve(__dirname, '../../backend/src/main/proto');
const ENDPOINT = 'localhost:9090';
const LOAD_OPTS = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
};

function makeClient(protoFile, serviceName) {
  const pkgDef = protoLoader.loadSync(path.join(PROTO_DIR, protoFile), LOAD_OPTS);
  const pkg = grpc.loadPackageDefinition(pkgDef);
  return new pkg.hospital[serviceName](ENDPOINT, grpc.credentials.createInsecure());
}

const hospitalClient = makeClient('hospital.proto', 'HospitalService');
const patientClient  = makeClient('patient.proto',  'PatientService');
const stayClient     = makeClient('stay.proto',     'StayService');
const billClient     = makeClient('bill.proto',     'BillService');

function call(client, method, req) {
  return new Promise((resolve, reject) => {
    client[method](req, (err, res) => {
      if (err) reject(new Error(err.details || err.message));
      else resolve(res);
    });
  });
}

const resolvers = {
  Query: {
    hospital: (_, { id }) =>
      call(hospitalClient, 'getHospital', { id: parseInt(id, 10) }),

    hospitals: (_, { page = 0, size = 10 }) =>
      call(hospitalClient, 'listHospitals', { page: { page, size } }),

    patient: (_, { id }) =>
      call(patientClient, 'getPatient', { id: parseInt(id, 10) }),

    patients: (_, { page = 0, size = 10 }) =>
      call(patientClient, 'listPatients', { page: { page, size } }),

    staysByPatient: (_, { patientId, page = 0, size = 10 }) =>
      call(stayClient, 'listStaysByPatient', {
        patientId: parseInt(patientId, 10),
        page: { page, size },
      }),

    bill: (_, { id }) =>
      call(billClient, 'getBill', { id: parseInt(id, 10) }),

    billsByPatient: (_, { patientId, page = 0, size = 10 }) =>
      call(billClient, 'listBillsByPatient', {
        patientId: parseInt(patientId, 10),
        page: { page, size },
      }),
  },

  Mutation: {
    createHospital: (_, { name, address, dailyRate }) =>
      call(hospitalClient, 'createHospital', { name, address, dailyRate }),

    createPatient: (_, { firstName, lastName, dateOfBirth, sex, email }) =>
      call(patientClient, 'createPatient', { firstName, lastName, dateOfBirth, sex, email }),

    registerAtHospital: (_, { patientId, hospitalId, admissionDate }) =>
      call(patientClient, 'registerAtHospital', {
        patientId: parseInt(patientId, 10),
        hospitalId: parseInt(hospitalId, 10),
        admissionDate,
      }),

    createStay: (_, { patientId, hospitalId, startDate, endDate }) =>
      call(stayClient, 'createStay', {
        patientId: parseInt(patientId, 10),
        hospitalId: parseInt(hospitalId, 10),
        startDate,
        endDate,
      }),

    cancelStay: (_, { id }) =>
      call(stayClient, 'cancelStay', { id: parseInt(id, 10) }),

    markBillPaid: (_, { id }) =>
      call(billClient, 'markBillPaid', { id: parseInt(id, 10) }),
  },

  Stay: {
    billId: (stay) => {
      const id = stay.billId;
      if (!id || id === '0' || id === 0) return null;
      return String(id);
    },
  },
};

module.exports = { resolvers };
