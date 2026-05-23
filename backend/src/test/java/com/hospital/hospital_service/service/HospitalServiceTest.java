package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class HospitalServiceTest {

    @Autowired
    private HospitalService hospitalService;

    @Test
    void createHospital_savesAndReturnsWithId() {
        String name = "General Hospital";
        String address = "123 Maple St";
        Integer rate = 50;
        Hospital hospital = hospitalService.createHospital(name, address, rate);

        assertThat(hospital.getId()).isNotNull();
        assertThat(hospital.getCreatedAt()).isNotNull();
        assertThat(hospital.getUpdatedAt()).isNotNull();
        assertThat(hospital.getName()).isEqualTo(name);
        assertThat(hospital.getAddress()).isEqualTo(address);
        assertThat(hospital.getDailyRate()).isEqualTo(rate);
    }

    @Test
    void getHospital_returnsCorrectHospital() {
        String name = "Test Hospital";
        String address = "456 Oak Ave";
        Hospital created = hospitalService.createHospital(name, address, 30);

        Hospital fetched = hospitalService.getHospital(created.getId());
        assertThat(fetched.getName()).isEqualTo(name);
        assertThat(fetched.getAddress()).isEqualTo(address);
    }

    @Test
    void getHospital_throwsWhenNotFound() {
        assertThatThrownBy(() -> hospitalService.getHospital(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Hospital not found");
    }

    @Test
    void listHospitals_returnsPagedResults() {
        hospitalService.createHospital("Hospital A", "1 First St", 20);
        hospitalService.createHospital("Hospital B", "2 Second St", 30);

        Page<Hospital> page = hospitalService.listHospitals(PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(2);
    }
}
