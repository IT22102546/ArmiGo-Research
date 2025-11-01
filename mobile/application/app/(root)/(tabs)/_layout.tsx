import { Tabs, router } from "expo-router";
import { Image, Text, TouchableOpacity, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants";
import useAuthStore from "@/stores/authStore";

const TabsLayout = () => {
  const phoneNumber = "+94720804389";
  const whatsappNumber = "94720804389";

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const message = "Hello, I'm interested in your services";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${whatsappNumber}`);
    });
  };

  const handleSubmitAd = () => {
    const state = useAuthStore.getState();
    if (state.isSignedIn) {
      router.push("/SelectPost");
    } else {
      router.push("/(auth)/otp-request");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#2C3036]">
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#2C3036",
            height: 90,
            borderTopWidth: 0,
          },
        }}
        tabBar={() => (
          <View className="flex-row justify-between items-center bg-[#2C3036] h-24 px-6">
            {/* Contact Us Button */}
            <TouchableOpacity
              className="flex-row items-center bg-[#3A3F47] px-4 py-2 rounded-full"
              onPress={handlePhoneCall}
            >
              <Image
                source={icons.phone}
                className="w-5 h-5 mr-2"
                tintColor="#FEE01C"
              />
              <Text className="text-[#FEE01C] font-medium">Contact us</Text>
            </TouchableOpacity>

            {/* Submit (+) Button in Middle */}
            <TouchableOpacity
              onPress={handleSubmitAd}
              className="bg-[#FEE01C] w-14 h-14 rounded-full items-center justify-center -mt-20"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Text className="text-black text-2xl font-bold">+</Text>
            </TouchableOpacity>

            {/* WhatsApp Button */}
            <TouchableOpacity
              className="flex-row items-center bg-[#3A3F47] px-4 py-2 rounded-full"
              onPress={handleWhatsApp}
            >
              <Image
                source={icons.whatsapp}
                className="w-5 h-5 mr-2"
                tintColor="#FEE01C"
              />
              <Text className="text-[#FEE01C] font-medium">WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <Tabs.Screen name="home" options={{ headerShown: false }} />

        <Tabs.Screen
          name="SubmitPost"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default TabsLayout;
