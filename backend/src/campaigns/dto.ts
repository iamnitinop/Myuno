export class CreateCampaignDto {
    name: string;
    type: string;
    creativeJson: any;
    rulesJson: any;
}

export class UpdateCampaignDto {
    name?: string;
    type?: string;
    creativeJson?: any;
    rulesJson?: any;
    status?: string;
}
