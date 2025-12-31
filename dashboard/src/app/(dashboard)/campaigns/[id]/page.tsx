import CampaignEditor from "./CampaignEditor";

export default function CampaignPage({ params }: { params: { id: string } }) {
    return <CampaignEditor campaignId={params.id} />;
}

