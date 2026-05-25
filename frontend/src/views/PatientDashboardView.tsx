import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  CancelStayDocument,
  CreateStayDocument,
  DeleteHospitalDocument,
  DeletePatientDocument,
  GenerateBillDocument,
  GetBillsByPatientDocument,
  GetHospitalsByPatientDocument,
  GetPatientDocument,
  GetStaysByPatientDocument,
  MarkBillPaidDocument,
  UpdateHospitalDocument,
  UpdatePatientDocument,
} from '../graphql/__generated__/graphql';
import type {
  BillStatus,
  GetBillsByPatientQuery,
  GetHospitalsByPatientQuery,
  GetStaysByPatientQuery,
  Sex,
  StayStatus,
} from '../graphql/__generated__/graphql';

type Stay = GetStaysByPatientQuery['staysByPatient']['stays'][number];
type Bill = GetBillsByPatientQuery['billsByPatient']['bills'][number];
type Hospital = GetHospitalsByPatientQuery['hospitalsByPatient']['hospitals'][number];

const SEX_LABEL: Record<Sex, string> = {
  SEX_MALE: 'Male',
  SEX_FEMALE: 'Female',
  SEX_UNSPECIFIED: '—',
};

const STAY_TAG: Record<StayStatus, { color: string; label: string }> = {
  STAY_STATUS_LIVE: { color: 'green', label: 'Live' },
  STAY_STATUS_CANCELLED: { color: 'red', label: 'Cancelled' },
  STAY_STATUS_UNSPECIFIED: { color: 'default', label: '—' },
};

const BILL_TAG: Record<BillStatus, { color: string; label: string }> = {
  BILL_STATUS_OUTSTANDING: { color: 'orange', label: 'Outstanding' },
  BILL_STATUS_PAID: { color: 'green', label: 'Paid' },
  BILL_STATUS_UNSPECIFIED: { color: 'default', label: '—' },
};

function quarterLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()} Q${Math.ceil((d.getMonth() + 1) / 3)}`;
}

function QuarterlyChart({ stays }: { stays: Stay[] }) {
  const counts = stays.reduce<Record<string, number>>((acc, stay) => {
    const q = quarterLabel(stay.startDate);
    acc[q] = (acc[q] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <Typography.Text type="secondary">No stays recorded yet.</Typography.Text>;
  }

  const BAR_W = 52;
  const BAR_GAP = 24;
  const CHART_H = 120;
  const maxCount = Math.max(...entries.map(([, v]) => v));
  const svgW = entries.length * (BAR_W + BAR_GAP) + BAR_GAP;

  return (
    <svg
      width={svgW}
      height={CHART_H + 44}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {entries.map(([label, count], i) => {
        const barH = Math.max(6, (count / maxCount) * CHART_H);
        const x = BAR_GAP + i * (BAR_W + BAR_GAP);
        const y = CHART_H - barH;
        return (
          <g key={label}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill="#1677ff" rx={4} />
            <text
              x={x + BAR_W / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={13}
              fill="#333"
              fontWeight={600}
            >
              {count}
            </text>
            <text
              x={x + BAR_W / 2}
              y={CHART_H + 18}
              textAnchor="middle"
              fontSize={11}
              fill="#888"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export default function PatientDashboardView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [addStayModalOpen, setAddStayModalOpen] = useState(false);
  const [patientForm] = Form.useForm();
  const [hospitalForm] = Form.useForm();
  const [stayForm] = Form.useForm();
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  const { data: patientData, refetch: refetchPatient } = useQuery(GetPatientDocument, {
    variables: { id: id! },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: staysData, loading: staysLoading } = useQuery(GetStaysByPatientDocument, {
    variables: { patientId: id!, size: 100 },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: billsData, loading: billsLoading } = useQuery(GetBillsByPatientDocument, {
    variables: { patientId: id!, size: 100 },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: hospitalsData, loading: hospitalsLoading, refetch: refetchHospitals } = useQuery(
    GetHospitalsByPatientDocument,
    { variables: { patientId: id!, size: 100 }, skip: !id, fetchPolicy: 'cache-and-network' },
  );

  const [cancelStay, { loading: cancelling }] = useMutation(CancelStayDocument, {
    refetchQueries: ['GetStaysByPatient'],
  });

  const [markBillPaid, { loading: marking }] = useMutation(MarkBillPaidDocument, {
    refetchQueries: ['GetBillsByPatient'],
  });

  const [updatePatient, { loading: updatingPatient }] = useMutation(UpdatePatientDocument);

  const [deletePatient, { loading: deletingPatient }] = useMutation(DeletePatientDocument, {
    onError: (err) => notification.error({ message: err.message }),
  });

  const [createStay, { loading: creatingStay }] = useMutation(CreateStayDocument, {
    refetchQueries: ['GetStaysByPatient'],
  });

  const [generateBill, { loading: generatingBill }] = useMutation(GenerateBillDocument, {
    refetchQueries: ['GetBillsByPatient', 'GetStaysByPatient'],
  });

  const [updateHospital, { loading: updatingHospital }] = useMutation(UpdateHospitalDocument);

  const [deleteHospital, { loading: deletingHospital }] = useMutation(DeleteHospitalDocument, {
    onError: (err) => notification.error({ message: err.message }),
  });

  const patient = patientData?.patient;
  const stays = staysData?.staysByPatient.stays ?? [];
  const bills = billsData?.billsByPatient.bills ?? [];
  const hospitals = hospitalsData?.hospitalsByPatient.hospitals ?? [];
  const hospitalMap = new Map(hospitals.map((h) => [h.id, h.name]));

  function handlePatientEditOpen() {
    if (!patient) return;
    patientForm.setFieldsValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: dayjs(patient.dateOfBirth),
      sex: patient.sex,
      email: patient.email,
    });
    setPatientModalOpen(true);
  }

  async function handlePatientSave() {
    const values = patientForm.getFieldsValue() as {
      firstName: string;
      lastName: string;
      dateOfBirth: ReturnType<typeof dayjs> | null;
      sex: Sex;
      email: string;
    };
    const trim = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

    await updatePatient({
      variables: {
        id: id!,
        firstName: trim(values.firstName),
        lastName: trim(values.lastName),
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
        sex: values.sex ?? undefined,
        email: trim(values.email),
      },
    });
    await refetchPatient();
    setPatientModalOpen(false);
  }

  async function handlePatientDelete() {
    try {
      const result = await deletePatient({ variables: { id: id! } });
      if (result.data?.deletePatient) navigate('/patients');
    } catch {
      // error shown via onError handler
    }
  }

  async function handleGenerateBill() {
    const result = await generateBill({ variables: { patientId: id! } });
    if (result.data?.generateBill === 0) {
      notification.info({ message: 'No unbilled stays found. All stays already have a bill assigned.' });
    }
  }

  async function handleHospitalSave() {
    if (!editingHospital) return;
    const values = hospitalForm.getFieldsValue() as {
      name: string;
      address: string;
      dailyRate: number | null;
    };
    const trim = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

    await updateHospital({
      variables: {
        id: editingHospital.id,
        name: trim(values.name),
        address: trim(values.address),
        dailyRate: typeof values.dailyRate === 'number' ? values.dailyRate : undefined,
      },
    });
    await refetchHospitals();
    setEditingHospital(null);
  }

  async function handleStaySave() {
    const values = stayForm.getFieldsValue() as {
      hospitalId: string;
      startDate: ReturnType<typeof dayjs> | null;
      endDate: ReturnType<typeof dayjs> | null;
    };
    await createStay({
      variables: {
        patientId: id!,
        hospitalId: values.hospitalId,
        startDate: values.startDate!.format('YYYY-MM-DD'),
        endDate: values.endDate!.format('YYYY-MM-DD'),
      },
    });
    stayForm.resetFields();
    setAddStayModalOpen(false);
  }

  async function handleHospitalDelete(hospital: Hospital) {
    try {
      const result = await deleteHospital({ variables: { id: hospital.id } });
      if (result.data?.deleteHospital) await refetchHospitals();
    } catch {
      // error shown via onError handler
    }
  }

  const hospitalColumns: TableColumnsType<Hospital> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Address', dataIndex: 'address' },
    {
      title: 'Daily Rate',
      dataIndex: 'dailyRate',
      render: (v: number) => fmt.format(v),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, hospital) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              hospitalForm.setFieldsValue({
                name: hospital.name,
                address: hospital.address,
                dailyRate: hospital.dailyRate,
              });
              setEditingHospital(hospital);
            }}
          />
          <Popconfirm
            title="Delete this hospital? Warning this will delete the hospital across all patients and cannot be undone."
            onConfirm={() => handleHospitalDelete(hospital)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" loading={deletingHospital} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stayColumns: TableColumnsType<Stay> = [
    {
      title: 'Hospital',
      dataIndex: 'hospitalId',
      render: (hId: string) => hospitalMap.get(hId) ?? hId,
    },
    { 
      title: 'Start Date',
      dataIndex: 'startDate' },
    {
      title: 'End Date',
      dataIndex: 'endDate',
    },
    { title: 'Duration',
      key: 'duration',
      render: (_, stay) => {
        const days = dayjs(stay.endDate).diff(dayjs(stay.startDate), 'day');
        return `${days} day${days !== 1 ? 's' : ''}`;
  }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: StayStatus) => {
        const { color, label } = STAY_TAG[s];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Bill No.',
      dataIndex: 'billId'
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, stay) =>
        stay.status === 'STAY_STATUS_LIVE' && stay.billId === null ? (
          <Tooltip title="Only unbilled stays can be cancelled.">
          <Popconfirm
            title="Cancel this stay?"
            onConfirm={() => cancelStay({ variables: { id: stay.id } })}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" loading={cancelling}>
              Cancel
            </Button>
          </Popconfirm>
          </Tooltip>
        ) : null,
    },
  ];

  const billColumns: TableColumnsType<Bill> = [
    {title: 'Bill No.',
      dataIndex: 'id',},
    {
      title: 'Hospital',
      dataIndex: 'hospitalId',
      render: (hId: string) => hospitalMap.get(hId) ?? hId,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      render: (v: number) => fmt.format(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: BillStatus) => {
        const { color, label } = BILL_TAG[s];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, bill) =>
        bill.status === 'BILL_STATUS_OUTSTANDING' ? (
          <Popconfirm
            title="Mark this bill as paid?"
            onConfirm={() => markBillPaid({ variables: { id: bill.id } })}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" size="small" loading={marking}>
              Mark Paid
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  if (!patient) {
    return (
      <div style={{ padding: 24 }}>
        <Typography.Text type="secondary">Loading…</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')}>
          Back
        </Button>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {patient.firstName} {patient.lastName}
        </Typography.Title>
      </Space>

      <Card
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={handlePatientEditOpen}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this patient? This cannot be undone."
              onConfirm={handlePatientDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} loading={deletingPatient}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Descriptions column={2}>
          <Descriptions.Item label="First Name">{patient.firstName}</Descriptions.Item>
          <Descriptions.Item label="Last Name">{patient.lastName}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">{patient.dateOfBirth}</Descriptions.Item>
          <Descriptions.Item label="Sex">{SEX_LABEL[patient.sex]}</Descriptions.Item>
          <Descriptions.Item label="Email">{patient.email}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="Edit Patient"
        open={patientModalOpen}
        onCancel={() => setPatientModalOpen(false)}
        onOk={handlePatientSave}
        confirmLoading={updatingPatient}
        okText="Save"
      >
        <Form form={patientForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="First Name" name="firstName">
            <Input />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName">
            <Input />
          </Form.Item>
          <Form.Item label="Date of Birth" name="dateOfBirth">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Sex" name="sex">
            <Select
              options={[
                { value: 'SEX_MALE', label: 'Male' },
                { value: 'SEX_FEMALE', label: 'Female' },
                { value: 'SEX_UNSPECIFIED', label: '—' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Card title="Registered Hospitals" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          loading={hospitalsLoading}
          dataSource={hospitals}
          columns={hospitalColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Stay Summary by Quarter" style={{ marginBottom: 16 }}>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <QuarterlyChart stays={stays} />
        </div>
      </Card>

      <Card
        title="Stay History"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" onClick={() => setAddStayModalOpen(true)}>
            Add Stay
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={staysLoading}
          dataSource={stays}
          columns={stayColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card
        title="Bills"
        extra={
          <Tooltip title='A bill for each hospital will be generated for all unbilled stayed. Be sure to cancel any stays which should not be billed.'>
          <Button type="primary" loading={generatingBill} onClick={handleGenerateBill}>
            Generate Bill
          </Button>
          </Tooltip>
        }
      >
        <Table
          rowKey="id"
          loading={billsLoading}
          dataSource={bills}
          columns={billColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title="Add Stay"
        open={addStayModalOpen}
        onCancel={() => { stayForm.resetFields(); setAddStayModalOpen(false); }}
        onOk={handleStaySave}
        confirmLoading={creatingStay}
        okText="Add"
      >
        <Form form={stayForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Hospital" name="hospitalId" rules={[{ required: true, message: 'Please select a hospital' }]}>
            <Select
              options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
              placeholder="Select a hospital"
            />
          </Form.Item>
          <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: 'Please select a start date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="End Date" name="endDate" rules={[{ required: true, message: 'Please select an end date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Hospital"
        open={!!editingHospital}
        onCancel={() => setEditingHospital(null)}
        onOk={handleHospitalSave}
        confirmLoading={updatingHospital}
        okText="Save"
      >
        <Form form={hospitalForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="Daily Rate (£)" name="dailyRate">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
