import { FlatList, Pressable, Text, View } from "react-native";

interface InterestChipsProps {
  chips: string[];
  selectedCategory: string;
  onSelect: (chip: string) => void;
  onManage?: () => void;
}

export function InterestChips({
  chips,
  selectedCategory,
  onSelect,
  onManage,
}: InterestChipsProps) {
  return (
    <View className="flex-row items-center border-b border-border bg-background pb-3">
      <FlatList
        data={chips}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => {
          const isSelected = selectedCategory === item;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              className={`mr-2 rounded-full border px-4 py-2 ${
                isSelected
                  ? "bg-primary border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? "text-primary-foreground" : "text-card-foreground"
                }`}
              >
                {item === "all" ? "All" : item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
