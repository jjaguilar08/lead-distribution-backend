/** A single broker's share within PUT /api/distribution/brokers's request body. */
export interface DistributionBrokerInputDto {
  brokerId: number;
  percentage: number;
  isActive: boolean;
}

/** Request body for PUT /api/distribution/brokers. */
export interface ReplaceDistributionBrokersDto {
  brokers: DistributionBrokerInputDto[];
}

/** A DistributionBroker row joined with its broker's name, for the detail view. */
export interface DistributionBrokerDetailDto {
  id: number;
  brokerId: number;
  brokerName: string;
  percentage: number;
  isActive: boolean;
}

/** A lead summary row for the Distribution Detail page. */
export interface DistributionLeadDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  ipAddress: string;
  status: string;
  assignedBrokerId: number | null;
  createdAt: Date;
}
