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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { API_URL, fetchWithTimeout } from '../../config/api';

interface Student {
  id: string;
  name: string;
  gender: string;
  grade_level: string;
  strand: string;
  section: string;
  subject: string;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
}

interface FormData {
  name: string;
  gender: string;
  grade_level: string;
  strand: string;
  section: string;
  subject: string;
  avatar: string | null;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  guardian_name: string;
  guardian_relationship: string;
}

// Add debounce delay constant
const DEBOUNCE_DELAY = 1000; // 1 second delay
const ITEMS_PER_PAGE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function StudentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: '',
    grade_level: '',
    strand: '',
    section: '',
    subject: '',
    avatar: null,
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    guardian_name: '',
    guardian_relationship: '',
  });

  const gradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Sports', 'Arts & Design'];
  const sections = ['Sun Flower', 'Rose', 'Tulip', 'Daisy', 'Orchid'];
  const genders = ['Male', 'Female'];
  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'Filipino',
    'Social Studies',
    'Physical Education',
    'Values Education',
    'Computer Science',
    'Research',
    'Practical Research'
  ];

  // Debounce search query with longer delay
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (searchQuery.trim() && isMounted) {
        setPage(1);
        setStudents([]);
        fetchStudents(true);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Initial fetch with loading state
  useEffect(() => {
    let isMounted = true;
    const initialFetch = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          await fetchStudents(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Initial fetch error:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialFetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchStudents = async (isRefresh = false) => {
    if (loading && !isRefresh) return; // Prevent multiple simultaneous requests

    try {
      if (isRefresh) {
        setLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = isRefresh ? 1 : page;
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetchWithTimeout(`${API_URL}/students?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${searchQuery}`, {
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
          setStudents(data.students);
        } else {
          setStudents(prev => [...prev, ...data.students]);
        }
        setHasMore(data.students.length === ITEMS_PER_PAGE);
        setRetryCount(0);
        if (!isRefresh) {
          setPage(prev => prev + 1);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      // Only log errors that aren't network related or are unexpected
      if (!(error instanceof TypeError && error.message === 'Network request failed')) {
        console.error('Error fetching students:', error);
      }
      
      let errorMessage = 'Could not connect to server. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check if the server is running and your internet connection is stable.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchStudents(isRefresh);
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!isRefreshing && !loading) {
      setIsRefreshing(true);
      setPage(1);
      fetchStudents(true);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !loading) {
      fetchStudents();
    }
  };

  const handleAddStudent = () => {
    setFormData({
      name: '',
      gender: '',
      grade_level: '',
      strand: '',
      section: '',
      subject: '',
      avatar: null,
      email: '',
      phone: '',
      address: '',
      birth_date: '',
      guardian_name: '',
      guardian_relationship: '',
    });
    setIsAddModalVisible(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender,
      grade_level: student.grade_level,
      strand: student.strand,
      section: student.section,
      subject: student.subject || '',
      avatar: student.avatar,
      email: student.email || '',
      phone: student.phone || '',
      address: student.address || '',
      birth_date: student.birth_date || '',
      guardian_name: student.guardian_name || '',
      guardian_relationship: student.guardian_relationship || '',
    });
    setIsEditModalVisible(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
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
        setFormData((prevData: FormData) => ({
          ...prevData,
          avatar: selectedImage.uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show('Failed to pick image', { type: 'error' });
    }
  };

  const handleSubmitAdd = async () => {
    try {
      setLoading(true);
      
      // Log the form data before processing
      console.log('Form data before processing:', formData);
      
      // Create a JSON object for all fields except avatar
      const jsonData = {
        name: formData.name.trim(),
        gender: formData.gender.trim(),
        grade_level: formData.grade_level.trim(),
        strand: formData.strand.trim(),
        section: formData.section.trim(),
        subject: formData.subject.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        birth_date: formData.birth_date.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_relationship: formData.guardian_relationship.trim()
      };

      // Create FormData only for the avatar
      const formDataToSend = new FormData();
      
      // Add avatar if exists
      if (formData.avatar && typeof formData.avatar === 'string') {
        try {
          const uri = formData.avatar;
          const filename = uri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          console.log('Processing avatar:', { uri, filename, type });
          
          const response = await fetch(uri);
          const blob = await response.blob();
          
          formDataToSend.append('avatar', blob, filename);
          console.log('Avatar added to form data');
        } catch (error) {
          console.error('Error processing avatar:', error);
          toast.show('Failed to process avatar image', { type: 'error' });
          return;
        }
      }

      // Add all JSON data as a single field
      formDataToSend.append('data', JSON.stringify(jsonData));

      // Log the final FormData object
      console.log('Final FormData object:', formDataToSend);
      console.log('JSON data being sent:', jsonData);

      const response = await fetchWithTimeout(`${API_URL}/students`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json'
        },
      });

      // Log the raw response
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          // Format validation errors for display
          const formattedErrors = Object.entries(data.errors)
            .map(([field, messages]) => {
              const fieldName = field.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              return `${fieldName}: ${(messages as string[]).join(', ')}`;
            })
            .join('\n\n');
          
          console.log('Validation errors:', data.errors);
          Alert.alert(
            'Validation Error',
            formattedErrors,
            [{ text: 'OK' }]
          );
          return;
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to add student');
      }

      // Success handling
      setStudents([data.student, ...students]);
      setIsAddModalVisible(false);
      setFormData({
        name: '',
        gender: '',
        grade_level: '',
        strand: '',
        section: '',
        subject: '',
        avatar: null,
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        guardian_name: '',
        guardian_relationship: '',
      });
      toast.show('Student added successfully!', { type: 'success' });
    } catch (error: any) {
      console.error('Error adding student:', error);
      let errorMessage = 'Failed to add student. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name || !formData.gender || !formData.grade_level || !formData.strand || !formData.section || !formData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedStudent) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('grade_level', formData.grade_level);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('subject', formData.subject);
      
      if (formData.avatar) {
        const uri = formData.avatar;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';
        
        formDataToSend.append('avatar', {
          uri,
          name: filename,
          type,
        } as any);
      }

      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('phone', formData.phone.trim());
      formDataToSend.append('address', formData.address.trim());
      formDataToSend.append('birth_date', formData.birth_date.trim());
      formDataToSend.append('guardian_name', formData.guardian_name.trim());
      formDataToSend.append('guardian_relationship', formData.guardian_relationship.trim());

      const response = await fetchWithTimeout(
        `${API_URL}/students/${selectedStudent.id}`,
        {
          method: 'PUT',
          body: formDataToSend,
          headers: {
            'Accept': 'application/json'
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const updatedStudents = students.map((student) =>
          student.id === selectedStudent.id ? data.student : student
        );
        setStudents(updatedStudents);
        setIsEditModalVisible(false);
        toast.show('Student updated successfully!', { type: 'success' });
      } else {
        throw new Error(data.message || 'Failed to update student');
      }
    } catch (error: any) {
      console.error('Error updating student:', error);
      let errorMessage = 'Failed to update student. ';
      
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
    if (!selectedStudent) return;

    try {
      const response = await fetchWithTimeout(`${API_URL}/students/${selectedStudent.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        const updatedStudents = students.filter(
          (student) => student.id !== selectedStudent.id
        );
        setStudents(updatedStudents);
        setIsDeleteModalVisible(false);
        toast.show('Student deleted successfully!', { type: 'success' });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error deleting student:', error);
      let errorMessage = 'Failed to delete student. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    }
  };

  const getImageUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    // Remove /api prefix since the backend serves uploads directly
    return `${API_URL.replace('/api', '')}${avatar}`;
  };

  const StudentForm = ({ isEdit }: { isEdit: boolean }) => {
    // Remove localFormData state and use formData directly
    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

    const handleChange = (field: keyof FormData, value: string | boolean) => {
      // Update form data directly
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear error for this field if it exists
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

    const validateForm = () => {
      console.log('Validating form data:', formData);
      const errors: Partial<FormData> = {};
      
      if (!formData.name?.trim()) {
        errors.name = 'Name is required';
      }
      if (!formData.gender?.trim()) {
        errors.gender = 'Gender is required';
      }
      if (!formData.grade_level?.trim()) {
        errors.grade_level = 'Grade level is required';
      }
      if (!formData.strand?.trim()) {
        errors.strand = 'Strand is required';
      }
      if (!formData.section?.trim()) {
        errors.section = 'Section is required';
      }
      if (!formData.subject?.trim()) {
        errors.subject = 'Subject is required';
      }

      console.log('Form validation errors:', errors);
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
      console.log('Form data before submission:', formData);
      if (validateForm()) {
        console.log('Form is valid, proceeding with submission');
        if (isEdit) {
          handleSubmitEdit();
        } else {
          handleSubmitAdd();
        }
      } else {
        console.log('Form validation failed');
        Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      }
    };

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{isEdit ? 'Edit Student' : 'Add Student'}</Text>
          <TouchableOpacity onPress={() => isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContent}>
          <ScrollView 
            style={styles.formScrollView}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={[styles.input, formErrors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Enter student's name"
            />
            {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}

            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={[styles.pickerContainer, formErrors.gender && styles.inputError]}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                {genders.map((gender) => (
                  <Picker.Item key={gender} label={gender} value={gender} />
                ))}
              </Picker>
            </View>
            {formErrors.gender && <Text style={styles.errorText}>{formErrors.gender}</Text>}

            <Text style={styles.inputLabel}>Grade Level *</Text>
            <View style={[styles.pickerContainer, formErrors.grade_level && styles.inputError]}>
              <Picker
                selectedValue={formData.grade_level}
                onValueChange={(value) => handleChange('grade_level', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Grade Level" value="" />
                {gradeLevels.map((level) => (
                  <Picker.Item key={level} label={level} value={level} />
                ))}
              </Picker>
            </View>
            {formErrors.grade_level && <Text style={styles.errorText}>{formErrors.grade_level}</Text>}

            <Text style={styles.inputLabel}>Strand *</Text>
            <View style={[styles.pickerContainer, formErrors.strand && styles.inputError]}>
              <Picker
                selectedValue={formData.strand}
                onValueChange={(value) => handleChange('strand', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Strand" value="" />
                {strands.map((strand) => (
                  <Picker.Item key={strand} label={strand} value={strand} />
                ))}
              </Picker>
            </View>
            {formErrors.strand && <Text style={styles.errorText}>{formErrors.strand}</Text>}

            <Text style={styles.inputLabel}>Section *</Text>
            <View style={[styles.pickerContainer, formErrors.section && styles.inputError]}>
              <Picker
                selectedValue={formData.section}
                onValueChange={(value) => handleChange('section', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Section" value="" />
                {sections.map((section) => (
                  <Picker.Item key={section} label={section} value={section} />
                ))}
              </Picker>
            </View>
            {formErrors.section && <Text style={styles.errorText}>{formErrors.section}</Text>}

            <Text style={styles.inputLabel}>Subject *</Text>
            <View style={[styles.pickerContainer, formErrors.subject && styles.inputError]}>
              <Picker
                selectedValue={formData.subject}
                onValueChange={(value) => {
                  console.log('Subject selected:', value);
                  handleChange('subject', value);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((subject) => (
                  <Picker.Item key={subject} label={subject} value={subject} />
                ))}
              </Picker>
            </View>
            {formErrors.subject && <Text style={styles.errorText}>{formErrors.subject}</Text>}

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, formErrors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="Enter student's email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={[styles.input, formErrors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              placeholder="Enter student's phone number"
              keyboardType="phone-pad"
            />
            {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, formErrors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="Enter student's address"
              multiline
            />
            {formErrors.address && <Text style={styles.errorText}>{formErrors.address}</Text>}

            <Text style={styles.inputLabel}>Birth Date</Text>
            <TextInput
              style={[styles.input, formErrors.birth_date && styles.inputError]}
              value={formData.birth_date}
              onChangeText={(text) => handleChange('birth_date', text)}
              placeholder="YYYY-MM-DD"
            />
            {formErrors.birth_date && <Text style={styles.errorText}>{formErrors.birth_date}</Text>}

            <Text style={styles.inputLabel}>Guardian Name</Text>
            <TextInput
              style={[styles.input, formErrors.guardian_name && styles.inputError]}
              value={formData.guardian_name}
              onChangeText={(text) => handleChange('guardian_name', text)}
              placeholder="Enter guardian's name"
            />
            {formErrors.guardian_name && <Text style={styles.errorText}>{formErrors.guardian_name}</Text>}

            <Text style={styles.inputLabel}>Guardian Relationship</Text>
            <TextInput
              style={[styles.input, formErrors.guardian_relationship && styles.inputError]}
              value={formData.guardian_relationship}
              onChangeText={(text) => handleChange('guardian_relationship', text)}
              placeholder="Enter guardian's relationship"
            />
            {formErrors.guardian_relationship && <Text style={styles.errorText}>{formErrors.guardian_relationship}</Text>}

            <Text style={styles.inputLabel}>Profile Image</Text>
            <TouchableOpacity 
              style={styles.imagePickerButton} 
              onPress={handleImagePick}
            >
              <Text style={styles.imagePickerText}>
                {formData.avatar ? 'Change Image' : 'Choose File'}
              </Text>
            </TouchableOpacity>
            {formData.avatar && (
              <Image 
                source={{ uri: formData.avatar }} 
                style={styles.previewImage}
                onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
              />
            )}
          </ScrollView>
        </View>

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
              {isEdit ? 'Update Student' : 'Add Student'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search student"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications" size={24} color="#fff" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Title and Add Button */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Students</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddStudent}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>
      {/* Student List with Pull to Refresh and Infinite Scroll */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={40} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setRetryCount(0);
              fetchStudents(true);
            }}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentInfo}>
                {item.avatar ? (
                  <Image 
                    source={{ uri: getImageUrl(item.avatar) || '' }}
                    style={styles.avatar}
                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <MaterialIcons name="person" size={30} color="#666" />
                  </View>
                )}
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{item.name}</Text>
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
                    <Text style={styles.detailLabel}>Grade:</Text>
                    <Text style={styles.detailValue}>{item.grade_level}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Strand:</Text>
                    <Text style={styles.detailValue}>{item.strand}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Section:</Text>
                    <Text style={styles.detailValue}>{item.section}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditStudent(item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteStudent(item)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
          contentContainerStyle={styles.studentList}
        />
      )}
      {/* Add Student Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <StudentForm isEdit={false} />
        </View>
      </Modal>
      {/* Edit Student Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <StudentForm isEdit={true} />
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
            <Text style={styles.deleteTitle}>Are you sure you want to delete this student?</Text>
            <Text style={styles.deleteMessage}>
              This action cannot be undone. This will permanently delete the student record from the database.
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
  searchIcon: {
    marginRight: 8,
    color: '#666',
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
  studentList: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1a73e8',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%', // Limit height to 90% of screen
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formContent: {
    flex: 1,
  },
  formScrollView: {
    padding: 24,
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
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
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
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteAction: {
    padding: 12,
    minWidth: 120,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelDelete: {
    backgroundColor: '#f5f5f5',
  },
  confirmDelete: {
    backgroundColor: '#FF3B30',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
});