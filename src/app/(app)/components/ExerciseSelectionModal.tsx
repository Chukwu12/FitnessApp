import {
  View,
  Text,
  Modal,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useWorkoutStore } from "store/workout-store";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {ExerciseCard} from ''
import {client} from ''

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExerciseSelectionModal({
  visible,
  onClose,
}: ExerciseSelectionModalProps) {
  const router = useRouter();
  const { addExerciseToWorkout } = useWorkoutStore();
  const [exercies, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExercises = async () => {
    try {
        const exercises = await client.fetch(exercisesQuery);
        setExercises(exercies);
        setFilteredExercises(exercies);
    } catch (error) {
        console.error('Error fetching exercises', error);
    }
  }


  const handleExercisePress = (exercie: Exercise) => {
    //Directly add exercise to workout
    addExerciseToWorkout({ name: exercise.name, sanityId: exercie._id});
    onClose();
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onclose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="bg-white px-4 pb-6 shadow-sm border-border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-800">
              Add Exercise
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-4">
            Tap any exercise to add it to your workout
          </Text>

          {/* SearchBar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exercise List */}
        <FlatList
        data={filteredExercises}
        renderItem={({item}) => (
            <ExerciseCard
            item={item}
            onPress={() => handleExercisePress (item)}
            showChevron={false} 
            />
  )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndictor=(false)
            contentContainerStyle={{
                paddingTop: 16,
                paddingBottom: 32,
                paddingHorizontal: 16,
            }}
        
            refreshControl={
              <RefreshingControl  
                refreshing={refreshing}
            onRefreshing={onRefresh}
            colors={['#3BB2F6']} // android
            tintColor='#3B82F6'//ios
            />
            }
            ListEmptyConponent={
                <View className='flex-1 items-center justify-center py-20'>
                <Ionicons name='fitness-outline' size={64} color='#D1D5DB' />
                <Text className='text-lg font-semibold text-gray-400 mt-4'>
                {searchQuery ? 'No exercises found ' : 'Loading exercises...'}
                </Text>
                <Text className='text-sm text-gray-400 mt-2'>
                {searchQuery
                    ? 'Try adjusting your search' :
                    'Please wait a moment'
                }
                </Text>
                </View>
            }
            />
            </SafeAreaView>
            </Modal>
        );}

     
