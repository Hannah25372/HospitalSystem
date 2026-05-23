package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.HospitalRegistration;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.database.enums.Sex;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class PatientServiceTest {

    @Autowired
    private PatientService patientService;

    @Autowired
    private HospitalService hospitalService;

    @Test
    void createPatient_savesAndReturnsWithId() {
        Patient patient = patientService.createPatient("Jane", "Doe", LocalDate.of(1990, 5, 15), Sex.FEMALE, "jane@example.com");

        assertThat(patient.getId()).isNotNull();
        assertThat(patient.getFirstName()).isEqualTo("Jane");
        assertThat(patient.getEmail()).isEqualTo("jane@example.com");
    }

    @Test
    void getPatient_throwsWhenNotFound() {
        assertThatThrownBy(() -> patientService.getPatient(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Patient not found");
    }

    @Test
    void listPatients_returnsPagedResults() {
        patientService.createPatient("Alice", "Smith", LocalDate.of(1985, 3, 10), Sex.FEMALE, "alice@example.com");
        patientService.createPatient("Bob", "Jones", LocalDate.of(1978, 7, 22), Sex.MALE, "bob@example.com");

        Page<Patient> page = patientService.listPatients(PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void registerAtHospital_createsRegistration() {
        Patient patient = patientService.createPatient("Tom", "Brown", LocalDate.of(2000, 1, 1), Sex.MALE, "tom@example.com");
        var hospital = hospitalService.createHospital("General Hospital", "1 Health Ave", 40);

        HospitalRegistration registration = patientService.registerAtHospital(
                patient.getId(), hospital.getId(), LocalDate.of(2024, 6, 1));

        assertThat(registration.getId()).isNotNull();
        assertThat(registration.getPatient().getId()).isEqualTo(patient.getId());
        assertThat(registration.getHospital().getId()).isEqualTo(hospital.getId());
    }
}
