import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataRepository } from '@/lib/data-repository';
import { CustomerFeedbackFlow } from '@/components/feedback/CustomerFeedbackFlow';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clientId } = await params;
  const client = await DataRepository.getClientById(clientId);

  if (!client || client.status !== 'active') {
    return {
      title: 'Business Not Found | Autofocuss',
    };
  }

  return {
    title: `Share Your Feedback | ${client.business_name}`,
    description: `Rate your experience at ${client.business_name}. We value your review!`,
  };
}

export default async function PublicFeedbackPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = await DataRepository.getClientById(clientId);

  if (!client || client.status !== 'active') {
    notFound();
  }

  return (
    <main className="min-h-screen w-full bg-[#F5F8FF] flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-[345px] sm:max-w-md bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-8 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.12)]">
        <CustomerFeedbackFlow client={client} />
      </div>

      <footer className="mt-5 text-center">
        <p className="text-[11px] text-[#8A93A3] font-medium flex items-center justify-center gap-1.5">
          <span>Powered by</span>
          <span className="font-extrabold text-[#0B1220]">Autofocuss D(AI)Y</span>
        </p>
      </footer>
    </main>
  );
}
