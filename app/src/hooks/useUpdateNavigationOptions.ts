import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import React from "react";

type NavigationOptions =
  | Partial<BottomTabNavigationOptions>
  | Partial<NativeStackNavigationOptions>;

export default function useUpdateNavigationOptions(options: NavigationOptions) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  React.useEffect(() => {
    navigation.setOptions(options);
  }, [navigation, options]);
}
