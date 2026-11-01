import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TaxiFlow } from "../../../components/services/taxi-flow";
import { ShopFlow } from "../../../components/services/shop-flow";
import { TableFlow } from "../../../components/services/table-flow";
import { CinemaFlow } from "../../../components/services/cinema-flow";
import { AppointmentFlow } from "../../../components/services/appointment-flow";
import { MembershipFlow } from "../../../components/services/membership-flow";
import type { ServiceId } from "../../../lib/services";
import { colors, themed } from "../../../lib/theme";
import { layout } from "../../../ui";

/**
 * A service flow as its own page. The flows have steps with their own back control, so the page
 * has no native header (design/screens.md#service).
 */
export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: ServiceId }>();
  const exit = () => router.back();
  const flow = (() => {
    switch (id) {
      case "groceries":
      case "delivery":
        return <ShopFlow mode={id} onExit={exit} />;
      case "restaurants":
        return <TableFlow onExit={exit} />;
      case "cinema":
        return <CinemaFlow onExit={exit} />;
      case "doctors":
        return <AppointmentFlow onExit={exit} />;
      case "gyms":
        return <MembershipFlow onExit={exit} />;
      case "taxi":
        return <TaxiFlow onExit={exit} />;
      default:
        return null;
    }
  })();
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {flow}
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: layout.screenMargin },
}));
