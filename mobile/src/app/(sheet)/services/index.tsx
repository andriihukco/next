import { router, Stack } from "expo-router";
import { tabRootHeaderOptions } from "../../../components/navigation/header";
import { SERVICES } from "../../../lib/services";
import { Badge, Button, ListRow, Page, Section, Surface, Txt, type IconName } from "../../../ui";

const openService = (id: string): void => router.push({ pathname: "/service/[id]", params: { id } });

/** Послуги: demo services. Each one opens its flow as a page. Nothing is sent (DESIGN.md §7). */
export default function ServicesScreen() {
  return (
    <>
      <Stack.Screen options={tabRootHeaderOptions("Послуги")} />
      <Page>
        <Surface padded>
          <Badge label="Демо" tone="warning" />
          <Txt variant="title">Продукти до дверей</Txt>
          <Txt variant="subhead" tone="muted">
            Оберіть магазин, зберіть кошик і виберіть час доставки.
          </Txt>
          <Button label="Почати" onPress={() => openService("groceries")} />
        </Surface>

        <Section
          title="Усі сервіси"
          grouped
          footer="Сервіси в демонстраційному режимі. Замовлення, бронювання й оплата нічого не надсилають."
        >
          {SERVICES.map((service, index) => (
            <ListRow
              key={service.id}
              icon={service.icon as IconName}
              iconColor={service.color}
              title={service.label}
              subtitle={service.description}
              onPress={() => openService(service.id)}
              last={index === SERVICES.length - 1}
            />
          ))}
        </Section>
      </Page>
    </>
  );
}
