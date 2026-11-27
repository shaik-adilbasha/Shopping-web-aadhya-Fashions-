import { ServiceDetail } from '@/components/services/services-view'

export default async function ServicePage({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params
  return <ServiceDetail slug={slug} />
}
