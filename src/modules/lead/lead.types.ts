/** Request body for POST /api/public/leads/:slug. */
export interface SubmitLeadDto {
  name: string;
  email: string;
  phone: string;
}

/** Request body for PATCH /api/leads/:id/assign. */
export interface AssignLeadDto {
  brokerId: number;
}
