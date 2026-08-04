/** Request body for POST /api/brokers. */
export interface CreateBrokerDto {
  name: string;
  isActive?: boolean;
  dailyCap: number;
  timezone: string;
  openTime: string;
  closeTime: string;
  /** Comma-separated ISO weekday numbers (1=Monday..7=Sunday), e.g. "1,2,3,4,5". */
  workingDays: string;
}

/** Request body for PATCH /api/brokers/:id. All fields optional. */
export type UpdateBrokerDto = Partial<CreateBrokerDto>;

/** A lead assigned to a broker, joined with the name of the form it came through. */
export interface BrokerLeadDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: Date;
  formName: string;
}
