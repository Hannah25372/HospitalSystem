'use strict';

// Requires backend and gateway to be running.
// Run with cd gateway && npm test.
// ToDo: once delete implemented, clear db after to make tests repeatable.

const ENDPOINT = 'http://localhost:4000/graphql';

async function gql(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

describe('Hospital', () => {
  let createdHospitalId;

  test('createHospital returns the new hospital', async () => {
    const { data, errors } = await gql(`
      mutation CreateHospital($name: String!, $address: String!, $dailyRate: Int!) {
        createHospital(name: $name, address: $address, dailyRate: $dailyRate) {
          id
          name
          address
          dailyRate
        }
      }
    `, { name: 'Test Hospital', address: '1 Main St', dailyRate: 20 });

    expect(errors).toBeUndefined();
    expect(data.createHospital).toMatchObject({
      name: 'Test Hospital',
      address: '1 Main St',
      dailyRate: 20,
    });
    expect(data.createHospital.id).toBeTruthy();
    createdHospitalId = data.createHospital.id;
  });

  test('getHospital returns the created hospital', async () => {
    const { data, errors } = await gql(`
      query GetHospital($id: ID!) {
        hospital(id: $id) {
          id
          name
          address
          dailyRate
        }
      }
    `, { id: createdHospitalId });

    expect(errors).toBeUndefined();
    expect(data.hospital).toMatchObject({
      id: createdHospitalId,
      name: 'Test Hospital',
    });
  });

  test('hospitals list includes the created hospital', async () => {
    const { data, errors } = await gql(`
      query {
        hospitals(page: 0, size: 10) {
          hospitals { id name }
          pageInfo { totalElements }
        }
      }
    `);

    expect(errors).toBeUndefined();
    expect(data.hospitals.pageInfo.totalElements).toBe(1);
    const found = data.hospitals.hospitals.find(h => h.id === createdHospitalId);
    expect(found).toBeDefined();
  });
});

describe('Patient', () => {
  let createdPatientId;

  test('createPatient returns the new patient', async () => {
    const { data, errors } = await gql(`
      mutation CreatePatient(
        $firstName: String!, $lastName: String!,
        $dateOfBirth: String!, $sex: Sex!, $email: String!
      ) {
        createPatient(
          firstName: $firstName, lastName: $lastName,
          dateOfBirth: $dateOfBirth, sex: $sex, email: $email
        ) {
          id
          firstName
          lastName
          email
          sex
        }
      }
    `, {
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1990-06-15',
      sex: 'SEX_FEMALE',
      email: 'jane.doe@example.com',
    });

    expect(errors).toBeUndefined();
    expect(data.createPatient).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      sex: 'SEX_FEMALE',
    });
    expect(data.createPatient.id).toBeTruthy();
    createdPatientId = data.createPatient.id;
  });

  test('getPatient returns the created patient', async () => {
    const { data, errors } = await gql(`
      query GetPatient($id: ID!) {
        patient(id: $id) {
          id
          firstName
          lastName
          email
        }
      }
    `, { id: createdPatientId });

    expect(errors).toBeUndefined();
    expect(data.patient).toMatchObject({
      id: createdPatientId,
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  test('patients list includes the created patient', async () => {
    const { data, errors } = await gql(`
      query {
        patients(page: 0, size: 10) {
          patients { id firstName lastName }
          pageInfo { totalElements }
        }
      }
    `);

    expect(errors).toBeUndefined();
    expect(data.patients.pageInfo.totalElements).toBe(1);
    const found = data.patients.patients.find(p => p.id === createdPatientId);
    expect(found).toBeDefined();
  });
});

describe('Stay', () => {
  let hospitalId;
  let patientId;
  let stayId;

  beforeAll(async () => {
    const h = await gql(`
      mutation { createHospital(name: "Stay Hospital", address: "2 Side St", dailyRate: 15) { id } }
    `);
    hospitalId = h.data.createHospital.id;

    const p = await gql(`
      mutation {
        createPatient(firstName: "John", lastName: "Smith", dateOfBirth: "1985-03-10",
          sex: SEX_MALE, email: "john.smith@example.com") { id }
      }
    `);
    patientId = p.data.createPatient.id;
  });

  test('createStay returns the new stay', async () => {
    const { data, errors } = await gql(`
      mutation CreateStay($patientId: ID!, $hospitalId: ID!, $startDate: String!, $endDate: String!) {
        createStay(patientId: $patientId, hospitalId: $hospitalId, startDate: $startDate, endDate: $endDate) {
          id
          status
          startDate
          endDate
        }
      }
    `, { patientId, hospitalId, startDate: '2025-01-01', endDate: '2025-01-05' });

    expect(errors).toBeUndefined();
    expect(data.createStay).toMatchObject({
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      status: 'STAY_STATUS_LIVE',
    });
    stayId = data.createStay.id;
  });

  test('cancelStay changes status to CANCELLED', async () => {
    const { data, errors } = await gql(`
      mutation CancelStay($id: ID!) {
        cancelStay(id: $id) { id status }
      }
    `, { id: stayId });

    expect(errors).toBeUndefined();
    expect(data.cancelStay.status).toBe('STAY_STATUS_CANCELLED');
  });
});
