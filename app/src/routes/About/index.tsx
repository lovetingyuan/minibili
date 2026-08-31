import { Divider } from "@/components/styled/rneui";
import React from "react";
import { ScrollView, View } from "react-native";

import Header from "./Banner";
import BilibiliAccount from "./BilibiliAccount";
import BlackTags from "./BlackTags";
import Blacklist from "./Blacklist";
import SettingsSync from "./SettingsSync";
import SortCate from "./SortCate";
import Version from "./Version";
import { headerRight } from "./Header";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

function About() {
  useUpdateNavigationOptions({
    headerRight,
  });

  return (
    <ScrollView className="p-5">
      <Header />
      <Divider className="my-4" />
      <View className="gap-2">
        <Version />
        <BilibiliAccount />
        <SettingsSync />
      </View>
      <Divider className="my-4" />
      <BlackTags />
      <Blacklist />
      <SortCate />
      <View className="h-10" />
    </ScrollView>
  );
}

export default About;
