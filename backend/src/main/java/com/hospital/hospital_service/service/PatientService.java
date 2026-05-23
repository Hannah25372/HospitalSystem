package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.database.HospitalRegistration;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.database.enums.Sex;
import com.hospital.hospital_service.repository.HospitalRegistrationRepository;
import com.hospital.hospital_service.repository.HospitalRepository;
import com.hospital.hospital_service.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalRegistrationRepository registrationRepository;

    public Patient createPatient(String firstName, String lastName, LocalDate dateOfBirth, Sex sex, String email) {
        Patient patient = new Patient();
        patient.setFirstName(firstName);
        patient.setLastName(lastName);
        patient.setDateOfBirth(dateOfBirth);
        patient.setSex(sex);
        patient.setEmail(email);
        return patientRepository.save(patient);
    }

    public Patient getPatient(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
    }

    public Page<Patient> listPatients(Pageable pageable) {
        return patientRepository.findAll(pageable);
    }

    public HospitalRegistration registerAtHospital(Long patientId, Long hospitalId, LocalDate admissionDate) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found: " + hospitalId));

        HospitalRegistration registration = new HospitalRegistration();
        registration.setPatient(patient);
        registration.setHospital(hospital);
        registration.setAdmissionDate(admissionDate);
        return registrationRepository.save(registration);
    }
}
