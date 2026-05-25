import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  Descriptions,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  CancelStayDocument,
  GetBillsByPatientDocument,
  GetHospitalsByPatientDocument,
  GetPatientDocument,
  GetStaysByPatientDocument,
  MarkBillPaidDocument,
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

const hospitalColumns: TableColumnsType<Hospital> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Address', dataIndex: 'address' },
  {
    title: 'Daily Rate',
    dataIndex: 'dailyRate',
    render: (v: number) => fmt.format(v),
  },
];

export default function PatientDashboardView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patientData } = useQuery(GetPatientDocument, {
    variables: { id: id! },
    skip: !id,
  });

  const { data: staysData, loading: staysLoading } = useQuery(GetStaysByPatientDocument, {
    variables: { patientId: id!, size: 100 },
    skip: !id,
  });

  const { data: billsData, loading: billsLoading } = useQuery(GetBillsByPatientDocument, {
    variables: { patientId: id!, size: 100 },
    skip: !id,
  });

  const { data: hospitalsData, loading: hospitalsLoading } = useQuery(
    GetHospitalsByPatientDocument,
    { variables: { patientId: id!, size: 100 }, skip: !id },
  );

  const [cancelStay, { loading: cancelling }] = useMutation(CancelStayDocument, {
    refetchQueries: ['GetStaysByPatient'],
  });

  const [markBillPaid, { loading: marking }] = useMutation(MarkBillPaidDocument, {
    refetchQueries: ['GetBillsByPatient'],
  });

  const patient = patientData?.patient;
  const stays = staysData?.staysByPatient.stays ?? [];
  const bills = billsData?.billsByPatient.bills ?? [];
  const hospitals = hospitalsData?.hospitalsByPatient.hospitals ?? [];
  const hospitalMap = new Map(hospitals.map((h) => [h.id, h.name]));

  const stayColumns: TableColumnsType<Stay> = [
    {
      title: 'Hospital',
      dataIndex: 'hospitalId',
      render: (hId: string) => hospitalMap.get(hId) ?? hId,
    },
    { title: 'Start Date', dataIndex: 'startDate' },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      render: (v: string | null) => v ?? '—',
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
      title: '',
      key: 'actions',
      width: 100,
      render: (_, stay) =>
        stay.status === 'STAY_STATUS_LIVE' ? (
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
        ) : null,
    },
  ];

  const billColumns: TableColumnsType<Bill> = [
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

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Date of Birth">{patient.dateOfBirth}</Descriptions.Item>
          <Descriptions.Item label="Sex">{SEX_LABEL[patient.sex]}</Descriptions.Item>
          <Descriptions.Item label="Email">{patient.email}</Descriptions.Item>
        </Descriptions>
      </Card>

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

      <Card title="Stay History" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          loading={staysLoading}
          dataSource={stays}
          columns={stayColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Bills">
        <Table
          rowKey="id"
          loading={billsLoading}
          dataSource={bills}
          columns={billColumns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
