import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { env } from '../../config/env';
import { fetchWithTimeout } from '../../config/api';

// Remove the API_URL import and use env.API_URL instead
const API_URL = env.API_URL;

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  gender: string;
  image: string | null;
  image_url: string | null;
  phone?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  gender: string;
  image: string | null;
}

// Add debounce delay constant
const DEBOUNCE_DELAY = 1000; // 1 second delay
const ITEMS_PER_PAGE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Add initial form data constant
const INITIAL_FORM_DATA: FormData = {
  name: '',
  email: '',
  phone: '',
  subject: 'Not Assigned',
  gender: '',
  image: null,
};

export default function TeacherManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const toast = useToast();

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Form states
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const subjects = ['Not Assigned', 'Filipino', 'English', 'Mathematics', 'Science', 'Social Studies'];
  const genders = ['Male', 'Female'];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setPage(1);
        setTeachers([]);
        fetchTeachers(true);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchTeachers(true);
  }, []);

  const fetchTeachers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = isRefresh ? 1 : page;
      
      const response = await fetchWithTimeout(`${API_URL}/teachers?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${searchQuery}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (isRefresh) {
          setTeachers(data.teachers);
        } else {
          setTeachers(prev => [...prev, ...data.teachers]);
        }
        setHasMore(data.teachers.length === ITEMS_PER_PAGE);
        setRetryCount(0);
        if (!isRefresh) {
          setPage(prev => prev + 1);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch teachers');
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      let errorMessage = 'Could not connect to server. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check if the server is running and your internet connection is stable.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchTeachers(isRefresh);
        }, 2000);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchTeachers(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchTeachers();
    }
  };

  const handleAddTeacher = () => {
    // Reset form data to initial state
    setFormData(INITIAL_FORM_DATA);
    setIsAddModalVisible(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    console.log('Editing teacher:', teacher);
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subject: teacher.subject,
      gender: teacher.gender,
      image: teacher.image_url || teacher.image || null,
    });
    setIsEditModalVisible(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalVisible(true);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        setFormData({ ...formData, image: selectedImage.uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show('Failed to pick image', { type: 'error' });
    }
  };

  const handleSubmitAdd = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add all fields to FormData
      Object.entries({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        gender: formData.gender.trim(),
      }).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });
      
      // Handle image separately
      if (formData.image) {
        try {
          // Convert the URI to a Blob
          const response = await fetch(formData.image);
          const blob = await response.blob();
          
          // Get the file extension from the URI
          const uri = formData.image;
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          // Append the blob to FormData
          formDataToSend.append('image', blob, filename);
        } catch (error) {
          console.error('Error processing image:', error);
          toast.show('Failed to process image', { type: 'error' });
          return;
        }
      }

      console.log('Sending teacher data:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        gender: formData.gender,
        hasImage: !!formData.image
      });

      const response = await fetchWithTimeout(`${API_URL}/teachers`, {
        method: 'POST',
        body: formDataToSend,
      });

      const responseText = await response.text();
      console.log('Server response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to add teacher';
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors) {
            // Format validation errors into a readable message
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
              .join('\n');
            errorMessage = `Validation failed:\n${errorMessages}`;
          } else {
            errorMessage = errorData.message || errorMessage;
          }
          if (errorData.error) {
            console.error('Detailed error:', errorData.error);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      if (data.success) {
        setTeachers([...teachers, data.teacher]);
        setIsAddModalVisible(false);
        toast.show('Teacher added successfully!', { type: 'success' });
        // Clear form data
        setFormData(INITIAL_FORM_DATA);
      } else {
        throw new Error(data.message || 'Failed to add teacher');
      }
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      let errorMessage = 'Failed to add teacher. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedTeacher) return;

    try {
      const formDataToSend = new FormData();
      
      // Add _method=PUT for Laravel's form method spoofing
      formDataToSend.append('_method', 'PUT');
      
      // Log the form data before sending
      console.log('Form data before sending:', formData);
      
      // Add all fields to FormData
      Object.entries({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        gender: formData.gender.trim(),
      }).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
          console.log(`Appending ${key}:`, value);
        }
      });
      
      // Only append image if it's a new one (starts with data: or file:)
      if (formData.image && (formData.image.startsWith('data:') || formData.image.startsWith('file:'))) {
        try {
          // Convert the URI to a Blob
          const response = await fetch(formData.image);
          const blob = await response.blob();
          
          // Get the file extension and mime type
          const uri = formData.image;
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          // Create a new blob with the correct type
          const imageBlob = new Blob([blob], { type });
          
          // Append the blob to FormData with the correct filename and type
          formDataToSend.append('image', imageBlob, filename);
          
          console.log('Image details:', {
            filename,
            type,
            size: blob.size,
            uri: formData.image
          });
        } catch (error) {
          console.error('Error processing image:', error);
          toast.show('Failed to process image', { type: 'error' });
          return;
        }
      }

      // Log the final FormData contents
      console.log('Final FormData contents:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof Blob ? 'Blob data' : pair[1]));
      }

      console.log('Sending update request to:', `${API_URL}/teachers/${selectedTeacher.id}`);

      const response = await fetchWithTimeout(`${API_URL}/teachers/${selectedTeacher.id}`, {
        method: 'POST', // Change to POST since we're using _method=PUT
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
          // Remove Content-Type header to let the browser set it with the boundary
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (data.success) {
        const updatedTeachers = teachers.map((teacher) =>
          teacher.id === selectedTeacher.id ? data.teacher : teacher
        );
        setTeachers(updatedTeachers);
        setIsEditModalVisible(false);
        toast.show('Teacher updated successfully!', { type: 'success' });
      } else {
        throw new Error(data.message || 'Failed to update teacher');
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      let errorMessage = 'Failed to update teacher. ';
      
      if (error.message.includes('timed out')) {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetchWithTimeout(`${API_URL}/teachers/${selectedTeacher.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        const updatedTeachers = teachers.filter(
          (teacher) => teacher.id !== selectedTeacher.id
        );
        setTeachers(updatedTeachers);
        setIsDeleteModalVisible(false);
        toast.show('Teacher deleted successfully!', { type: 'success' });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      let errorMessage = 'Failed to delete teacher. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    }
  };

  const TeacherForm = ({ isEdit }: { isEdit: boolean }) => {
    const [localFormData, setLocalFormData] = useState<FormData>(isEdit ? formData : INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

    // Reset form when modal opens
    useEffect(() => {
      if (!isEdit) {
        setLocalFormData(INITIAL_FORM_DATA);
      } else {
        setLocalFormData(formData);
      }
      setFormErrors({});
    }, [isEdit, formData]);

    const handleLocalChange = (field: keyof FormData, value: string) => {
      setLocalFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when field is updated
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

    const validateForm = () => {
      const errors: Partial<FormData> = {};
      
      if (!localFormData.name?.trim()) {
        errors.name = 'Name is required';
      }
      if (!localFormData.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(localFormData.email)) {
        errors.email = 'Invalid email format';
      }
      if (!localFormData.phone?.trim()) {
        errors.phone = 'Phone number is required';
      }
      if (!localFormData.subject?.trim()) {
        errors.subject = 'Subject is required';
      }
      if (!localFormData.gender?.trim()) {
        errors.gender = 'Gender is required';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
      if (validateForm()) {
        setFormData(localFormData);
        if (isEdit) {
          handleSubmitEdit();
        } else {
          handleSubmitAdd();
        }
      } else {
        Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      }
    };

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{isEdit ? 'Edit Teacher' : 'Add Teacher'}</Text>
          <TouchableOpacity
            onPress={() => isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Name *</Text>
        <TextInput
          style={[styles.input, formErrors.name && styles.inputError]}
          value={localFormData.name}
          onChangeText={(text) => handleLocalChange('name', text)}
          placeholder="Enter teacher's name"
        />
        {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}

        <Text style={styles.inputLabel}>Email *</Text>
        <TextInput
          style={[styles.input, formErrors.email && styles.inputError]}
          value={localFormData.email}
          onChangeText={(text) => handleLocalChange('email', text)}
          placeholder="Enter teacher's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

        <Text style={styles.inputLabel}>Phone *</Text>
        <TextInput
          style={[styles.input, formErrors.phone && styles.inputError]}
          value={localFormData.phone}
          onChangeText={(text) => handleLocalChange('phone', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}

        <Text style={styles.inputLabel}>Subject *</Text>
        <View style={[styles.pickerContainer, formErrors.subject && styles.inputError]}>
          <Picker
            selectedValue={localFormData.subject}
            onValueChange={(value) => handleLocalChange('subject', value)}
            style={styles.picker}
          >
            {subjects.map((subject) => (
              <Picker.Item key={subject} label={subject} value={subject} />
            ))}
          </Picker>
        </View>
        {formErrors.subject && <Text style={styles.errorText}>{formErrors.subject}</Text>}

        <Text style={styles.inputLabel}>Gender *</Text>
        <View style={[styles.pickerContainer, formErrors.gender && styles.inputError]}>
          <Picker
            selectedValue={localFormData.gender}
            onValueChange={(value) => handleLocalChange('gender', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            {genders.map((gender) => (
              <Picker.Item key={gender} label={gender} value={gender} />
            ))}
          </Picker>
        </View>
        {formErrors.gender && <Text style={styles.errorText}>{formErrors.gender}</Text>}

        <Text style={styles.inputLabel}>Profile Image</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
          <Text style={styles.imagePickerText}>
            {localFormData.image ? 'Change Image' : 'Choose File'}
          </Text>
        </TouchableOpacity>
        {localFormData.image && (
          <Image 
            source={{ uri: localFormData.image }}
            style={styles.previewImage}
            onError={(e) => {
              console.log('Form image loading error:', e.nativeEvent.error);
              console.log('Attempted form image URL:', localFormData.image);
            }}
          />
        )}

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Update Teacher' : 'Add Teacher'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getImageUrl = (teacher: Teacher) => {
    // First try to use image_url if available
    if (teacher.image_url) {
      return teacher.image_url;
    }
    // Fallback to constructing URL from image path
    if (teacher.image) {
      if (teacher.image.startsWith('http')) return teacher.image;
      if (teacher.image.startsWith('data:')) return teacher.image;
      if (teacher.image.startsWith('file:')) return teacher.image;
      // Remove /api prefix and ensure proper URL construction
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}/storage/${teacher.image}`;
    }
    return null;
  };

  const renderTeacherItem = ({ item }: { item: Teacher }) => {
    const imageUrl = getImageUrl(item);
    return (
      <View style={styles.teacherCard}>
        <View style={styles.teacherInfo}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }}
              style={styles.avatar}
              onError={(e) => {
                console.log('List image loading error:', e.nativeEvent.error);
                console.log('Attempted list image URL:', imageUrl);
                console.log('Teacher data:', item);
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={30} color="#666" />
            </View>
          )}
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherName}>{item.name}</Text>
            <View style={styles.genderBadge}>
              <Text style={[
                styles.genderText,
                item.gender === 'Male' ? styles.maleText : styles.femaleText
              ]}>{item.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{item.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>{item.subject}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditTeacher(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTeacher(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search teachers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Teachers</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher List with Pull to Refresh and Infinite Scroll */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading teachers...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={40} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setRetryCount(0);
              fetchTeachers(true);
            }}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={renderTeacherItem}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#1a73e8" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          )}
          contentContainerStyle={styles.teacherList}
        />
      )}

      {/* Add Teacher Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <TeacherForm isEdit={false} />
        </View>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <TeacherForm isEdit={true} />
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.deleteConfirmation}>
            <Text style={styles.deleteTitle}>Are you sure you want to delete this teacher?</Text>
            <Text style={styles.deleteMessage}>
              This action cannot be undone. This will permanently delete the teacher record from the database.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteAction, styles.cancelDelete]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.deleteActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteAction, styles.confirmDelete]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a73e8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  teacherList: {
    padding: 12,
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  teacherInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  genderBadge: {
    backgroundColor: '#e0ffe0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  maleText: {
    color: '#1a73e8',
  },
  femaleText: {
    color: '#e91e63',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 80,
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1a73e8',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#666',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 12,
    padding: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteConfirmation: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteAction: {
    padding: 12,
    minWidth: 100,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelDelete: {
    backgroundColor: '#f5f5f5',
  },
  confirmDelete: {
    backgroundColor: '#ff4444',
  },
  deleteActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
}); 