import { useState, type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { IconButton } from "../components/ui/icon-button";
import { Toggle } from "../components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { TooltipProvider } from "../components/ui/tooltip";
import { MaterialIcon } from "../components/ui/material-icon";
import { UnifiedCard } from "../components/ui/unified-card";
import { QuickFacts } from "../components/ui/detail-layout";
import { ContextCard } from "../components/ui/context-card";
import { EntityDetail } from "../components/entity-detail";
import { TransitVehicleArtwork } from "../components/transit-vehicle-artwork";
import {
  ActionBar,
  ActionBarButton,
  DetailChip,
  DetailHero,
  DetailSection,
  ListRow,
  SheetNavBar,
  StatGrid,
} from "../components/ui/detail-layout";
import { CategoryTiles } from "../components/category-tiles";
import "./design-system.css";

/**
 * Developer reference at /design-system. Shows every token and component in
 * its states, so UI work can reuse them instead of copying values. Source of
 * truth for the rules is DESIGN.md; this page only displays them.
 */

const COLOR_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--surface-muted",
  "--muted-foreground",
  "--border",
  "--primary",
  "--primary-hover",
  "--primary-border",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--destructive",
  "--scrim",
];

const TYPE_TOKENS = [
  ["Caption", "--type-caption"],
  ["Small", "--type-small"],
  ["Body", "--type-body"],
  ["Title", "--type-title"],
  ["Inspector", "--type-inspector"],
  ["Display", "--type-display"],
] as const;

const RADIUS_TOKENS = ["--radius-sm", "--radius-md", "--radius-pill"] as const;
const SHADOW_TOKENS = ["--shadow-raised", "--shadow-overlay"] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="ds-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="ds-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ds-specimen">
      <span className="ds-specimen-label">{label}</span>
      <div className="ds-specimen-body">{children}</div>
    </div>
  );
}

function TokenSwatches() {
  return (
    <div className="ds-swatches">
      {COLOR_TOKENS.map((token) => (
        <div className="ds-swatch" key={token}>
          <span className="ds-swatch-chip" style={{ background: `var(${token})` }} aria-hidden="true" />
          <code>{token}</code>
        </div>
      ))}
    </div>
  );
}

function DesignSystemPage() {
  const [tab, setTab] = useState("places");
  const [choice, setChoice] = useState("list");
  const [pressed, setPressed] = useState(true);
  const [switched, setSwitched] = useState(true);
  const [sliderValue, setSliderValue] = useState([40]);
  const [categoryId, setCategoryId] = useState("popular");

  return (
    <TooltipProvider delayDuration={300}>
      <div className="ds-page">
        <header className="ds-header">
          <div>
            <p className="ds-eyebrow">Developer reference</p>
            <h1>Design system</h1>
            <p className="ds-lede">
              Every token and component, in its states. Build from these before adding anything new. Rules live in
              DESIGN.md.
            </p>
          </div>
          <nav aria-label="Sections" className="ds-nav">
            <a href="#tokens">Tokens</a>
            <a href="#components">Components</a>
            <a href="#patterns">Patterns</a>
          </nav>
        </header>

        <Section id="tokens" title="Tokens">
          <h3 className="ds-subtitle">Color</h3>
          <TokenSwatches />

          <h3 className="ds-subtitle">Type scale</h3>
          <div className="ds-type">
            {TYPE_TOKENS.map(([name, token]) => (
              <div className="ds-type-row" key={token}>
                <span className="ds-type-name">
                  {name} <code>{token}</code>
                </span>
                <span style={{ fontSize: `var(${token})`, lineHeight: 1.3 }}>The quick brown fox 0123</span>
              </div>
            ))}
          </div>

          <h3 className="ds-subtitle">Radius and elevation</h3>
          <div className="ds-tokens-row">
            {RADIUS_TOKENS.map((token) => (
              <div className="ds-radius" key={token} style={{ borderRadius: `var(${token})` }}>
                <code>{token}</code>
              </div>
            ))}
            {SHADOW_TOKENS.map((token) => (
              <div className="ds-shadow" key={token} style={{ boxShadow: `var(${token})` }}>
                <code>{token}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section id="components" title="Components">
          <Specimen label="Button">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Search" variant="outline">
              <MaterialIcon name="search" size={20} />
            </IconButton>
          </Specimen>

          <Specimen label="Badge">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Specimen>

          <Specimen label="Toggle (pill, for filters)">
            <Toggle variant="pill" pressed={pressed} onPressedChange={setPressed}>
              <MaterialIcon name="map" size={18} filled={pressed} />
              Map
            </Toggle>
            <Toggle variant="pill" size="sm" pressed={!pressed} onPressedChange={(v) => setPressed(!v)}>
              Small
            </Toggle>
            <Toggle variant="outline" pressed={switched} onPressedChange={setSwitched}>
              Outline
            </Toggle>
            <Toggle disabled>Disabled</Toggle>
          </Specimen>

          <Specimen label="ToggleGroup (single choice)">
            <ToggleGroup type="single" variant="outline" value={choice} onValueChange={(v) => v && setChoice(v)}>
              <ToggleGroupItem value="map">Map</ToggleGroupItem>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            </ToggleGroup>
          </Specimen>

          <Specimen label="Input and Label">
            <div className="ds-field">
              <Label htmlFor="ds-name">Name</Label>
              <Input id="ds-name" placeholder="Your name" />
            </div>
            <div className="ds-field">
              <Label htmlFor="ds-disabled">Disabled</Label>
              <Input id="ds-disabled" placeholder="Not editable" disabled />
            </div>
          </Specimen>

          <Specimen label="Select">
            <Select defaultValue="bus">
              <SelectTrigger aria-label="Transport type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="tram">Tram</SelectItem>
                <SelectItem value="trolley">Trolleybus</SelectItem>
              </SelectContent>
            </Select>
          </Specimen>

          <Specimen label="Switch">
            <Switch id="ds-switch" checked={switched} onCheckedChange={setSwitched} />
            <Label htmlFor="ds-switch">Show nearby</Label>
          </Specimen>

          <Specimen label="Slider">
            <div className="ds-slider">
              <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} aria-label="Radius" />
              <span>{sliderValue[0]} m</span>
            </div>
          </Specimen>

          <Specimen label="Tabs">
            <Tabs value={tab} onValueChange={setTab} className="ds-tabs">
              <TabsList>
                <TabsTrigger value="places">Places</TabsTrigger>
                <TabsTrigger value="transport">Transport</TabsTrigger>
              </TabsList>
              <TabsContent value="places">Places content</TabsContent>
              <TabsContent value="transport">Transport content</TabsContent>
            </Tabs>
          </Specimen>

          <Specimen label="Dialog and Sheet">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>Short description of what this dialog does.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>Side panel for details and settings.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </Specimen>

          <Specimen label="IconButton (labeled, shows tooltip on hover)">
            <IconButton label="Swap places" variant="outline">
              <MaterialIcon name="swap_vert" size={20} />
            </IconButton>
          </Specimen>

          <Specimen label="Card">
            <Card className="ds-card">
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Card description</CardDescription>
              </CardHeader>
              <CardContent>Card content</CardContent>
            </Card>
          </Specimen>

          <Specimen label="Separator and Skeleton">
            <div className="ds-stack">
              <span>Above</span>
              <Separator />
              <span>Below</span>
              <Skeleton className="ds-skeleton" />
            </div>
          </Specimen>

          <Specimen label="CategoryTiles">
            <CategoryTiles
              label="Category"
              value={categoryId}
              onChange={setCategoryId}
              items={[
                { id: "popular", label: "Popular", icon: "award_star", color: "var(--category-popular)" },
                { id: "food", label: "Food", icon: "restaurant", color: "var(--category-food)", count: 12 },
                { id: "transport", label: "Transport", icon: "directions_bus", color: "var(--transport-trolleybus)" },
              ]}
            />
          </Specimen>
        </Section>

        <Section id="patterns" title="Patterns">
          <Specimen label="Vehicle artwork (route color is the fleet token)">
            <div className="ds-stack-wide">
              <TransitVehicleArtwork id="1001" route="1" type="bus" />
              <TransitVehicleArtwork id="2045" route="9" type="trolleybus" />
              <TransitVehicleArtwork id="3310" route="4" type="tram" />
            </div>
          </Specimen>

          <Specimen label="UnifiedCard">
            <div className="ds-stack-wide">
              <UnifiedCard variant="directory" onClick={() => undefined}>
                <UnifiedCard.Header title="Place name" subtitle="Short summary of the place" category="Category" icon="place" />
                <UnifiedCard.Meta label="Hours" value="09:00–21:00" icon="schedule" />
                <UnifiedCard.Action label="Open" variant="primary" />
              </UnifiedCard>
            </div>
          </Specimen>

          <Specimen label="ContextCard (search results, map style)">
            <div className="ds-stack-wide">
              <ContextCard
                title="Place name"
                category="Category"
                icon="place"
                iconColor="var(--category-food)"
                subtitle="450 м · Street address, 12"
                rating={{ value: 4.6, count: 128 }}
                onOpen={() => undefined}
                actions={[
                  { label: "Маршрут", icon: "directions", primary: true, onClick: () => undefined },
                  { label: "На мапі", icon: "map", onClick: () => undefined },
                ]}
              />
              <ContextCard
                title="Place without a photo or rating"
                category="Category"
                icon="store"
                iconColor="var(--category-shopping)"
                subtitle="1,2 км · No rating shown without a source"
                onOpen={() => undefined}
              />
            </div>
          </Specimen>

          <Specimen label="Selected place: hero, action bar, quick facts, detail">
            <div className="ds-stack-wide">
              <EntityDetail
                kind="food"
                title="Place name"
                eyebrow="Category"
                subtitle="450 м · Street address, 12"
                icon="restaurant"
                iconColor="var(--category-food)"
                info={[
                  { icon: "schedule", label: "Години роботи", value: "09:00–21:00" },
                  { icon: "place", label: "Адреса", value: "Street address, 12" },
                  { icon: "call", label: "Телефон", value: "+380 00 000 00 00", href: "tel:+380000000000" },
                ]}
                description="Short description of the place from its source."
                coordinates={[24.03, 49.84]}
                saved={false}
                onToggleSaved={() => undefined}
                onShowOnMap={() => undefined}
                onDirections={() => undefined}
              />
            </div>
          </Specimen>

          <Specimen label="QuickFacts">
            <div className="ds-stack-wide">
              <QuickFacts
                facts={[
                  { icon: "schedule", label: "Години роботи", value: "09:00–21:00" },
                  { icon: "payments", label: "Оплата", value: "Картка, готівка" },
                  { icon: "language", label: "Сайт", value: "example.com", href: "https://example.com" },
                ]}
              />
            </div>
          </Specimen>

          <Specimen label="Detail sheet">
            <div className="ds-stack-wide">
              <SheetNavBar title="Place" onBack={() => undefined} />
              <DetailHero
                eyebrow="Eyebrow"
                title="Hero title"
                subtitle="Hero subtitle"
                chips={<DetailChip icon="schedule">Open now</DetailChip>}
              />
              <ActionBar>
                <ActionBarButton icon="directions" label="Route" onClick={() => undefined} primary />
                <ActionBarButton icon="bookmark" label="Save" onClick={() => undefined} pressed={false} />
              </ActionBar>
              <DetailSection title="Section">
                <StatGrid items={[{ label: "Rating", value: "4.6" }]} />
                <ListRow title="Row title" subtitle="Row subtitle" onClick={() => undefined} />
              </DetailSection>
            </div>
          </Specimen>
        </Section>
      </div>
    </TooltipProvider>
  );
}

export { DesignSystemPage };
