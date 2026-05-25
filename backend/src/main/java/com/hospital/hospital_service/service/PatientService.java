package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.database.HospitalRegistration;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.database.enums.Sex;
import com.hospital.hospital_service.repository.HospitalRegistrationRepository;
import com.hospital.hospital_service.repository.HospitalRepository;
import com.hospital.hospital_service.repository.PatientRepository;
import com.hospital.hospital_service.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalRegistrationRepository registrationRepository;
    private final StayRepository stayRepository;

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

    public Page<Patient> listPatientsByHospital(Long hospitalId, Pageable pageable) {
        return patientRepository.findByHospitalId(hospitalId, pageable);
    }

    public Patient updatePatient(Long id, String firstName, String lastName, LocalDate dateOfBirth, Sex sex, String email) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        if (firstName != null) patient.setFirstName(firstName);
        if (lastName != null) patient.setLastName(lastName);
        if (dateOfBirth != null) patient.setDateOfBirth(dateOfBirth);
        if (sex != null) patient.setSex(sex);
        if (email != null) patient.setEmail(email);
        return patientRepository.save(patient);
    }

    @Transactional
    public void deletePatient(Long id) {
        if (stayRepository.existsByPatientId(id)) {
            throw new RuntimeException("Cannot delete patient: they have associated stays.");
        }
        registrationRepository.deleteByPatientId(id);
        patientRepository.deleteById(id);
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
