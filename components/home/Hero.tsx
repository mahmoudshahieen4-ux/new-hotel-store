import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroCarousel from "./HeroCarousel";

function Hero() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4">
      <div className="w-full order-1 md:order-2">
        <HeroCarousel />
      </div>

      <div className="order-2 md:order-1 flex flex-col items-start gap-4">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
          We are changing the way people shop
        </h1>
        <p className="mt-2 max-w-xl text-lg leading-8 text-muted-foreground">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum
          optio, ab, sapiente eaque aut perferendis impedit!
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/products">Our Products</Link>
        </Button>
      </div>
    </section>
  );
}

export default Hero;
