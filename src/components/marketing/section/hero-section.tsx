import { Container } from "@/components/marketing/container";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="py-20 md:py-32">
      <Container>
        <div className="text-center space-y-8">
          <h1>History is not meant to be memorized...</h1>
          <p>We help young generations...</p>
          <div className="flex gap-4">
            <Button size="lg">Try HistoryTalk</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}