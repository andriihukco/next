import { useMemo, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { DetailChip, DetailSection } from "./ui/detail-layout";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";
import { MaterialIcon } from "./ui/material-icon";
import { Switch } from "./ui/switch";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import type { MenuItem } from "./entity-detail";
import "./order-page.css";

/**
 * Order page for «Замовити». It opens full screen, without the map, and
 * collects the items, delivery, contact details, notes, a callback request and
 * the payment method. Nothing is sent: no provider is connected yet (DESIGN.md §7).
 */

type Fulfillment = "delivery" | "pickup";
type Payment = "cash" | "card-online" | "card-courier";

const DEMO_NOTE = "Це демо: замовлення нікуди не надіслано.";
const money = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

const PAYMENT_LABELS: Record<Payment, string> = {
  cash: "Готівкою",
  "card-online": "Карткою онлайн",
  "card-courier": "Карткою кур’єру",
};

type OrderPageProps = {
  placeName: string;
  items: MenuItem[];
  onClose: () => void;
  onDone: (message: string) => void;
};

export function OrderPage({ placeName, items, onClose, onDone }: OrderPageProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [address, setAddress] = useState("");
  const [entrance, setEntrance] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [callBack, setCallBack] = useState(false);
  const [payment, setPayment] = useState<Payment>("cash");
  const [submitted, setSubmitted] = useState(false);

  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0),
    [items, cart],
  );
  const change = (id: string, delta: number): void =>
    setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) }));

  const errors = {
    items: count === 0 ? "Додайте хоча б одну страву." : "",
    address: fulfillment === "delivery" && !address.trim() ? "Вкажіть адресу доставки." : "",
    name: !name.trim() ? "Вкажіть ім’я." : "",
    phone:
      !phone.trim() || !PHONE_PATTERN.test(phone.trim()) || phone.replace(/\D/g, "").length < 9
        ? "Вкажіть номер телефону, щоб ми могли підтвердити замовлення."
        : "",
  };
  const messages = Object.values(errors).filter(Boolean);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSubmitted(true);
    if (messages.length > 0) return;
    const delivery = fulfillment === "delivery" ? `доставка: ${address.trim()}` : "самовивіз";
    onDone(
      `Замовлення з «${placeName}» на ${money.format(total)}, ${delivery}, оплата: ${PAYMENT_LABELS[payment].toLowerCase()}. ${DEMO_NOTE}`,
    );
  };

  return (
    <div className="order-page" role="dialog" aria-modal="true" aria-labelledby="order-page-title">
      <header className="order-page-head">
        <IconButton label="Назад" onClick={onClose}>
          <MaterialIcon name="arrow_back" size={20} />
        </IconButton>
        <div className="order-page-title">
          <span className="detail-eyebrow">{placeName}</span>
          <h2 id="order-page-title">Замовлення</h2>
        </div>
        <DetailChip icon="science">Демо</DetailChip>
      </header>

      <form className="order-page-body" onSubmit={submit} noValidate>
        <div className="order-page-scroll">
          <DetailSection title="Страви">
            {items.length === 0 ? (
              <p className="order-page-empty">Меню цього закладу ще не підключене.</p>
            ) : (
              <ul className="order-items">
                {items.map((item) => {
                  const quantity = cart[item.id] ?? 0;
                  return (
                    <li key={item.id} className="order-item">
                      <span className="order-item-copy">
                        <strong>{item.name}</strong>
                        <span>{item.description}</span>
                        <span className="order-item-price">{money.format(item.price)}</span>
                      </span>
                      <span
                        className="order-stepper"
                        role="group"
                        aria-label={`Кількість: ${item.name}`}
                      >
                        {quantity > 0 && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Менше: ${item.name}`}
                              onClick={() => change(item.id, -1)}
                            >
                              <MaterialIcon name="remove" size={18} />
                            </Button>
                            <output aria-live="polite">{quantity}</output>
                          </>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Додати: ${item.name}`}
                          onClick={() => change(item.id, 1)}
                        >
                          <MaterialIcon name="add" size={18} />
                        </Button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </DetailSection>

          <DetailSection title="Отримання">
            <ToggleGroup
              type="single"
              value={fulfillment}
              onValueChange={(value) => value && setFulfillment(value as Fulfillment)}
              aria-label="Спосіб отримання"
              className="order-segment"
            >
              <ToggleGroupItem value="delivery" size="lg">
                Доставка
              </ToggleGroupItem>
              <ToggleGroupItem value="pickup" size="lg">
                Самовивіз
              </ToggleGroupItem>
            </ToggleGroup>
            {fulfillment === "delivery" && (
              <div className="order-fields">
                <label className="order-field">
                  <span>Адреса доставки</span>
                  <Input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    autoComplete="street-address"
                    placeholder="Вулиця, будинок"
                  />
                </label>
                <label className="order-field">
                  <span>Під’їзд, квартира (необов’язково)</span>
                  <Input value={entrance} onChange={(event) => setEntrance(event.target.value)} />
                </label>
              </div>
            )}
            {submitted && errors.address && (
              <p className="order-error" role="alert">
                {errors.address}
              </p>
            )}
          </DetailSection>

          <DetailSection title="Контакти">
            <div className="order-fields">
              <label className="order-field">
                <span>Ім’я</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="order-field">
                <span>Телефон</span>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="+380"
                />
              </label>
            </div>
            {submitted && errors.name && (
              <p className="order-error" role="alert">
                {errors.name}
              </p>
            )}
            {submitted && errors.phone && (
              <p className="order-error" role="alert">
                {errors.phone}
              </p>
            )}
            <label className="order-toggle">
              <span>
                <strong>Передзвонити для підтвердження</strong>
                <span>Заклад або кур’єр зателефонує перед виконанням.</span>
              </span>
              <Switch
                checked={callBack}
                onCheckedChange={setCallBack}
                aria-label="Передзвонити для підтвердження"
              />
            </label>
          </DetailSection>

          <DetailSection title="Коментар">
            <label className="order-field">
              <span>Побажання до замовлення</span>
              <textarea
                className="order-textarea"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Без цибулі, дзвінок не потрібен, тощо"
              />
            </label>
          </DetailSection>

          <DetailSection title="Оплата">
            <ToggleGroup
              type="single"
              value={payment}
              onValueChange={(value) => value && setPayment(value as Payment)}
              aria-label="Спосіб оплати"
              className="order-payment"
            >
              {(Object.keys(PAYMENT_LABELS) as Payment[]).map((option) => (
                <ToggleGroupItem key={option} value={option} size="lg">
                  {PAYMENT_LABELS[option]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </DetailSection>

          {submitted && messages.length > 0 && (
            <p className="order-error order-error-summary" role="alert">
              Перевірте поля: {messages.length} {messages.length === 1 ? "помилка" : "помилки"}.
            </p>
          )}
        </div>

        <footer className="order-page-foot">
          <span className="order-total">
            <span>{count > 0 ? `${count} шт.` : "Кошик порожній"}</span>
            <strong>{money.format(total)}</strong>
          </span>
          <Button type="submit" size="lg" disabled={count === 0}>
            {count === 0 ? "Додайте страви" : "Оформити"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
