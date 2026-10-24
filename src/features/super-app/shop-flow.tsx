import { useMemo, useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowField, FlowOption, FlowResult, FlowShell, QuantityStepper } from "./flow-shell";
import {
  GROCERY_CATALOG,
  GROCERY_STORES,
  MENUS,
  RESTAURANTS,
  formatUAH,
  type DemoItem,
} from "./demo-data";

/**
 * Groceries and delivery share one flow: pick a store, add items to the cart,
 * then choose pick-up or delivery. The cart is the same in both (Glovo and
 * grocery apps use this order).
 */
export type ShopMode = "groceries" | "delivery";

const STEPS = ["Заклад", "Товари", "Кошик", "Оформлення"] as const;
const TIMES = ["Якомога швидше", "Через 1 годину", "Через 2 години"] as const;
const PAYMENTS = ["Картою онлайн", "Готівкою при отриманні"] as const;

const COPY: Record<
  ShopMode,
  { title: string; stores: string; storesIntro: string; resultTitle: string }
> = {
  groceries: {
    title: "Продукти",
    stores: "Оберіть магазин",
    storesIntro: "Додайте товари в кошик і заберіть самі або замовте доставку.",
    resultTitle: "Замовлення прийнято",
  },
  delivery: {
    title: "Доставка",
    stores: "Оберіть заклад",
    storesIntro: "Меню закладу, кошик і доставка або самовивіз.",
    resultTitle: "Замовлення прийнято",
  },
};

export function ShopFlow({ mode, onExit }: { mode: ShopMode; onExit: () => void }) {
  const copy = COPY[mode];
  const stores = mode === "groceries" ? GROCERY_STORES : RESTAURANTS;
  const [step, setStep] = useState(0);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("delivery");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState<(typeof TIMES)[number]>(TIMES[0]);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]>(PAYMENTS[0]);
  const [orderNumber] = useState(() => String(1000 + Math.floor(Math.random() * 9000)));

  const store = stores.find((item) => item.id === storeId) ?? null;
  const catalog: DemoItem[] = useMemo(() => {
    if (!storeId) return [];
    return mode === "groceries" ? GROCERY_CATALOG : (MENUS[storeId] ?? []);
  }, [mode, storeId]);

  const lines = catalog.flatMap((item) => {
    const qty = cart[item.id] ?? 0;
    return qty > 0 ? [{ item, qty, total: qty * item.price }] : [];
  });
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const needsAddress = fulfillment === "delivery";
  const addressMissing = needsAddress && address.trim().length < 5;

  const setQty = (id: string, qty: number): void => {
    setCart((current) => ({ ...current, [id]: qty }));
  };

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  const cartSummary = (
    <span>{itemCount > 0 ? `${itemCount} шт · ${formatUAH(total)}` : "Кошик порожній"}</span>
  );

  if (step >= STEPS.length) {
    return (
      <FlowResult
        icon="shopping_bag"
        title={copy.resultTitle}
        onClose={onExit}
        closeLabel="До сервісів"
      >
        <p>
          Замовлення №{orderNumber} · {store?.name}
        </p>
        <p>
          {fulfillment === "pickup"
            ? `Заберіть у закладі: ${store?.address}`
            : `Доставка на адресу: ${address.trim()}`}
        </p>
        <p>
          {time} · {payment.toLowerCase()} · разом {formatUAH(total)}
        </p>
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title={copy.title}
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step === 1 || step === 2 ? (
          cartSummary
        ) : step === 3 ? (
          <span>Разом {formatUAH(total)}</span>
        ) : undefined
      }
      onNext={
        step === 1
          ? () => setStep(2)
          : step === 2
            ? () => setStep(3)
            : step === 3
              ? () => setStep(STEPS.length)
              : undefined
      }
      nextLabel={step === 1 ? "До кошика" : step === 2 ? "Оформити" : "Підтвердити"}
      nextDisabled={
        (step === 1 && itemCount === 0) ||
        (step === 2 && itemCount === 0) ||
        (step === 3 && (itemCount === 0 || addressMissing))
      }
      nextHint={
        step === 1 && itemCount === 0
          ? "Додайте хоча б один товар."
          : step === 3 && addressMissing
            ? "Вкажіть адресу доставки, щоб підтвердити."
            : undefined
      }
    >
      {step === 0 && (
        <section aria-label={copy.stores}>
          <h4 className="flow-section-title">{copy.stores}</h4>
          <p className="flow-intro">{copy.storesIntro}</p>
          <div className="flow-list">
            {stores.map((item) => (
              <FlowOption
                key={item.id}
                title={item.name}
                subtitle={`${item.kind} · ${item.hours} · ${item.eta}`}
                icon={mode === "groceries" ? "shopping_basket" : "restaurant"}
                selected={storeId === item.id}
                onSelect={() => {
                  setStoreId(item.id);
                  setCart({});
                  setStep(1);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 1 && store && (
        <section aria-label="Товари">
          <h4 className="flow-section-title">{store.name}</h4>
          <p className="flow-intro">
            Доставка {store.eta} · {store.address}
          </p>
          <ul className="flow-list flow-list--rows">
            {catalog.map((item) => (
              <li key={item.id} className="flow-row">
                <span className="flow-row-text">
                  <span className="flow-option-title">{item.name}</span>
                  <span className="flow-option-subtitle">
                    {item.unit} · {formatUAH(item.price)}
                  </span>
                </span>
                <QuantityStepper
                  label={item.name}
                  value={cart[item.id] ?? 0}
                  onChange={(qty) => setQty(item.id, qty)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Кошик">
          <h4 className="flow-section-title">Кошик</h4>
          {lines.length === 0 ? (
            <p className="flow-intro">Кошик порожній. Поверніться до товарів.</p>
          ) : (
            <ul className="flow-list flow-list--rows">
              {lines.map(({ item, qty, total: lineTotal }) => (
                <li key={item.id} className="flow-row">
                  <span className="flow-row-text">
                    <span className="flow-option-title">{item.name}</span>
                    <span className="flow-option-subtitle">{formatUAH(lineTotal)}</span>
                  </span>
                  <QuantityStepper
                    label={item.name}
                    value={qty}
                    onChange={(next) => setQty(item.id, next)}
                  />
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="flow-link" onClick={() => setStep(1)}>
            <MaterialIcon name="add" size={18} />
            Додати товари
          </button>
        </section>
      )}

      {step === 3 && (
        <section aria-label="Оформлення">
          <h4 className="flow-section-title">Отримання</h4>
          <div className="flow-chips" role="group" aria-label="Спосіб отримання">
            <Toggle variant="pill"
             
             
              onClick={() => setFulfillment("pickup")} pressed={fulfillment === "pickup"}><MaterialIcon name="storefront" size={18} filled={fulfillment === "pickup"} />
              Самовивіз
            </Toggle>
            <Toggle variant="pill"
             
             
              onClick={() => setFulfillment("delivery")} pressed={fulfillment === "delivery"}><MaterialIcon name="delivery_dining" size={18} filled={fulfillment === "delivery"} />
              Доставка
            </Toggle>
          </div>

          {needsAddress && (
            <FlowField
              label="Адреса доставки"
              value={address}
              onChange={setAddress}
              autoComplete="street-address"
              placeholder="вул., будинок, квартира"
              required
            />
          )}

          <h4 className="flow-section-title">Коли</h4>
          <div className="flow-chips" role="group" aria-label="Час отримання">
            {TIMES.map((option) => (
              <Toggle variant="pill" key={option} onClick={() => setTime(option)} pressed={time === option}>
                {option}
              </Toggle>
            ))}
          </div>

          <h4 className="flow-section-title">Оплата</h4>
          <div className="flow-chips" role="group" aria-label="Спосіб оплати">
            {PAYMENTS.map((option) => (
              <Toggle variant="pill" key={option} onClick={() => setPayment(option)} pressed={payment === option}>
                {option}
              </Toggle>
            ))}
          </div>
        </section>
      )}
    </FlowShell>
  );
}
