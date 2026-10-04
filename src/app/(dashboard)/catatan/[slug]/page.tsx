import CatatanSubjectClient from './client'

export function generateStaticParams() {
  return [
    { slug: 'fisika-kimia' },
    { slug: 'konsep-si' },
    { slug: 'algoritma' },
    { slug: 'matematika' },
    { slug: 'digital' },
    { slug: 'isbd' },
    { slug: 'pancasila' },
    { slug: 'bisnis' },
  ]
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  return <CatatanSubjectClient slug={params.slug} />
}
