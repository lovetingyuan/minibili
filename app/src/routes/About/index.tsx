import { Divider } from "@/components/Divider";
import { ScrollView, View } from "react-native";

import Header from "./Banner";
import BlackTags from "./BlackTags";
import Blacklist from "./Blacklist";
import LibraryLinks from "./LibraryLinks";
import SettingsSync from "./SettingsSync";
import SortCate from "./SortCate";
import Version from "./Version";
import { headerRight, headerTitle } from "./Header";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

function About() {
  useUpdateNavigationOptions({
    headerRight,
    headerTitle,
  });

  return (
    <ScrollView contentContainerClassName="p-5 pb-10">
      <Header />
      <View className="gap-2">
        <Version />
        <SettingsSync />
      </View>
      <Divider className="my-4" />
      <LibraryLinks />
      <Divider className="my-4" />
      <BlackTags />
      <Blacklist />
      <SortCate />
      <View className="h-10" />
    </ScrollView>
  );
}

export default About;
