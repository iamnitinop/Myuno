export class CreateABTestDto {
    name: string;
    device: string;
    startDate: string;
    endDate: string;
    baselineId: string;
    baselinePercentage: number;
    variants: any; // array of { bannerId: string, percentage: number }
    status?: string;
}

export class UpdateABTestDto {
    name?: string;
    device?: string;
    startDate?: string;
    endDate?: string;
    baselineId?: string;
    baselinePercentage?: number;
    variants?: any;
    status?: string;
}
