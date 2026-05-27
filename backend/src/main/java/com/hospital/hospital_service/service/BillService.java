package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Bill;
import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.database.Stay;
import com.hospital.hospital_service.database.enums.BillStatus;
import com.hospital.hospital_service.database.enums.StayStatus;
import com.hospital.hospital_service.repository.BillRepository;
import com.hospital.hospital_service.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final StayRepository stayRepository;

    public Bill getBill(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));
    }

    public Page<Bill> listBillsByPatient(Long patientId, Pageable pageable) {
        return billRepository.findByPatientId(patientId, pageable);
    }

    @Transactional
    public int generateBill(Long patientId) {
        List<Stay> unbilled = stayRepository.findByPatientIdAndBillIsNullAndStatusNot(patientId, StayStatus.CANCELLED);
        if (unbilled.isEmpty()) return 0;

        Patient patient = unbilled.get(0).getPatient();
        Map<Hospital, List<Stay>> byHospital = unbilled.stream()
                .collect(Collectors.groupingBy(Stay::getHospital));

        int billsCreated = 0;
        for (Map.Entry<Hospital, List<Stay>> entry : byHospital.entrySet()) {
            Hospital hospital = entry.getKey();
            List<Stay> stays = entry.getValue();

            int totalAmount = stays.stream().mapToInt(stay -> {
                long days = ChronoUnit.DAYS.between(stay.getStartDate(), stay.getEndDate()) + 1;
                return (int) days * hospital.getDailyRate();
            }).sum();

            Bill bill = new Bill();
            bill.setPatient(patient);
            bill.setHospital(hospital);
            bill.setTotalAmount(totalAmount);
            bill.setStatus(BillStatus.OUTSTANDING);
            Bill savedBill = billRepository.save(bill);

            stays.forEach(stay -> {
                stay.setBill(savedBill);
                stayRepository.save(stay);
            });
            billsCreated++;
        }
        return billsCreated;
    }

    public Bill markBillPaid(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));
        bill.setStatus(BillStatus.PAID);
        return billRepository.save(bill);
    }
}
