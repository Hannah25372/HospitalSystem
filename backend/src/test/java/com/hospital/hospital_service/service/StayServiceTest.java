package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Stay;
import com.hospital.hospital_service.database.enums.Sex;
import com.hospital.hospital_service.database.enums.StayStatus;
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
class StayServiceTest {

    @Autowired
    private StayService stayService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private HospitalService hospitalService;

    @Test
    void createStay_savesWithLiveStatus() {
        var patient = patientService.createPatient("Alice", "Smith", LocalDate.of(1990, 1, 1), Sex.FEMALE, "alice@example.com");
        var hospital = hospitalService.createHospital("City Hospital", "1 Health Rd", 20);

        Stay stay = stayService.createStay(patient.getId(), hospital.getId(),
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 5));

        assertThat(stay.getId()).isNotNull();
        assertThat(stay.getStatus()).isEqualTo(StayStatus.LIVE);
        assertThat(stay.getPatient().getId()).isEqualTo(patient.getId());
        assertThat(stay.getHospital().getId()).isEqualTo(hospital.getId());
    }

    @Test
    void cancelStay_updatesStatusToCancelled() {
        var patient = patientService.createPatient("Bob", "Jones", LocalDate.of(1985, 6, 15), Sex.MALE, "bob@example.com");
        var hospital = hospitalService.createHospital("North Hospital", "2 Care St", 15);
        Stay stay = stayService.createStay(patient.getId(), hospital.getId(),
                LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 3));

        Stay cancelled = stayService.cancelStay(stay.getId());

        assertThat(cancelled.getStatus()).isEqualTo(StayStatus.CANCELLED);
    }

    @Test
    void cancelStay_throwsWhenNotFound() {
        assertThatThrownBy(() -> stayService.cancelStay(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Stay not found");
    }

    @Test
    void listStaysByPatient_returnsOnlyThatPatientsStays() {
        var patient1 = patientService.createPatient("Carol", "White", LocalDate.of(1992, 2, 20), Sex.FEMALE, "carol@example.com");
        var patient2 = patientService.createPatient("Dan", "Black", LocalDate.of(1988, 9, 5), Sex.MALE, "dan@example.com");
        var hospital = hospitalService.createHospital("South Hospital", "3 Well Ave", 10);

        stayService.createStay(patient1.getId(), hospital.getId(), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 3));
        stayService.createStay(patient1.getId(), hospital.getId(), LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 4));
        stayService.createStay(patient2.getId(), hospital.getId(), LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 2));

        Page<Stay> stays = stayService.listStaysByPatient(patient1.getId(), PageRequest.of(0, 10));

        assertThat(stays.getContent()).hasSize(2);
        assertThat(stays.getContent()).allMatch(s -> s.getPatient().getId().equals(patient1.getId()));
    }
}
