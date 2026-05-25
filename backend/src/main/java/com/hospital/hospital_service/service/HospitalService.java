package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.repository.HospitalRegistrationRepository;
import com.hospital.hospital_service.repository.HospitalRepository;
import com.hospital.hospital_service.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final HospitalRegistrationRepository registrationRepository;
    private final StayRepository stayRepository;

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

    public Page<Hospital> listHospitalsByPatient(Long patientId, Pageable pageable) {
        return hospitalRepository.findByPatientId(patientId, pageable);
    }

    public Hospital updateHospital(Long id, String name, String address, Integer dailyRate) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found: " + id));
        if (name != null) hospital.setName(name);
        if (address != null) hospital.setAddress(address);
        if (dailyRate != null) hospital.setDailyRate(dailyRate);
        return hospitalRepository.save(hospital);
    }

    @Transactional
    public void deleteHospital(Long id) {
        if (stayRepository.existsByHospitalId(id)) {
            throw new RuntimeException("Cannot delete hospital: it has associated stays.");
        }
        registrationRepository.deleteByHospitalId(id);
        hospitalRepository.deleteById(id);
    }
}
