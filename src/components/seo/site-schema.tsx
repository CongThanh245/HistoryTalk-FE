import { jsonLd, siteUrl } from "@/lib/seo";

export function SiteSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "HistoryTalk", url: siteUrl, logo: `${siteUrl}/icon.png` },
      { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "HistoryTalk", url: siteUrl, inLanguage: "vi", publisher: { "@id": `${siteUrl}/#organization` } },
      { "@type": "WebApplication", name: "HistoryTalk", url: siteUrl, applicationCategory: "EducationalApplication", operatingSystem: "Web", inLanguage: "vi", description: "Học lịch sử qua trò chuyện với nhân vật lịch sử, khám phá sự kiện và câu đố." },
    ],
  }) }} />;
}
