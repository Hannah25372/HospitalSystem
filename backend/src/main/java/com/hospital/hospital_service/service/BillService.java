package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Bill;
import com.hospital.hospital_service.database.enums.BillStatus;
import com.hospital.hospital_service.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;

    public Bill getBill(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));
    }

    public Page<Bill> listBillsByPatient(Long patientId, Pageable pageable) {
        return billRepository.findByPatientId(patientId, pageable);
    }

    public Bill markBillPaid(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));
        bill.setStatus(BillStatus.PAID);
        return billRepository.save(bill);
    }
}
