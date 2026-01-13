import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateEmailCaptureDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsNotEmpty()
    campaignId: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class GetEmailCapturesQueryDto {
    @IsString()
    @IsOptional()
    campaignId?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;
}
