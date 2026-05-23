package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    public Hospital createHospital(String name, String address, Integer dailyRate) {
        Hospital hospital = new Hospital();
        hospital.setName(name);
        hospital.setAddress(address);
        hospital.setDailyRate(dailyRate);
        return hospitalRepository.save(hospital);
    }

    public Hospital getHospital(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found: " + id));
    }

    public Page<Hospital> listHospitals(Pageable pageable) {
        return hospitalRepository.findAll(pageable);
    }
}
