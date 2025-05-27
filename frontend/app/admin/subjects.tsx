import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { fetchWithTimeout } from '../../config/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Subject {
  id: number;
  name: string;
  code: string;
  status: 'Available' | 'Unavailable';
  grade_level: string;
  strand: string;
  students: number;
  description: string;
}

interface FormData {
  name: string;
  code: string;
  status: 'Available' | 'Unavailable';
  grade_level: string;
  strand: string;
  description: string;
}

const API_URL = 'http://127.0.0.1:3001/api';

// Add debounce delay constant
const DEBOUNCE_DELAY = 1000; // 1 second delay
const ITEMS_PER_PAGE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Add this constant at the top of the file, after the interfaces
const INITIAL_FORM_DATA: FormData = {
  name: '',
  code: '',
  status: 'Available' as const,
  grade_level: '',
  strand: '',
  description: '',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Available':
      return '#4CAF50';
    case 'Unavailable':
      return '#F44336';
    default:
      return '#666';
  }
};

const SubjectsScreen = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form states
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const gradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const strands = ['No Strand', 'STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Sports', 'Arts & Design'];
  const statuses = ['Available', 'Unavailable'];

  // Add debug logging for auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth-token');
        console.log('Current auth state:', {
          isLoggedIn: !!user,
          hasToken: !!token,
          userRole: user?.role,
          tokenLength: token?.length
        });
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };
    checkAuth();
  }, [user]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setPage(1);
        setSubjects([]);
        fetchSubjects(true);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchSubjects(true);
  }, []);

  const fetchSubjects = async (isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug log before making the request
      const token = await AsyncStorage.getItem('auth-token');
      console.log('Making subjects request with:', {
        hasToken: !!token,
        tokenLength: token?.length,
        url: `${API_URL}/subjects?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(searchQuery)}`
      });
      
      const pageNum = isRefresh ? 1 : page;
      const response = await fetchWithTimeout(
        `${API_URL}/subjects?page=${pageNum}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      // Debug log the response
      console.log('Subjects API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Log more details about the unauthorized error
          const errorText = await response.text();
          console.error('Unauthorized access details:', {
            status: response.status,
            statusText: response.statusText,
            responseText: errorText
          });
          throw new Error('Please login to access this resource');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch subjects');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch subjects');
      }

      setSubjects(isRefresh ? data.subjects : [...subjects, ...data.subjects]);
      setHasMore(data.subjects.length === ITEMS_PER_PAGE);
      setPage(pageNum);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch subjects');
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSubjects(isRefresh);
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubjects(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchSubjects(true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchSubjects(true);
  };

  const handleAddSubject = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddModalVisible(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      status: subject.status,
      grade_level: subject.grade_level,
      strand: subject.strand,
      description: subject.description,
    });
    setIsEditModalVisible(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteModalVisible(true);
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsViewModalVisible(true);
  };

  const handleSubmitAdd = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields before submission
      if (!formData.name?.trim() || !formData.code?.trim() || !formData.grade_level?.trim() || !formData.strand?.trim()) {
        toast.show('Please fill in all required fields', { type: 'error' });
        return;
      }

      console.log('Adding new subject with data:', formData);

      const response = await fetchWithTimeout(`${API_URL}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          status: formData.status || 'Available',
          gradeLevel: formData.grade_level.trim(),
          strand: formData.strand.trim(),
          description: formData.description?.trim() || '',
        }),
      });

      const data = await response.json();
      console.log('Add response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to add subject');
      }

      setSubjects([data.subject, ...subjects]);
      setIsAddModalVisible(false);
      setFormData(INITIAL_FORM_DATA);
      toast.show('Subject added successfully!', { type: 'success' });
    } catch (error: any) {
      console.error('Error adding subject:', error);
      let errorMessage = 'Failed to add subject. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields before submission
      if (!formData.name?.trim() || !formData.code?.trim() || !formData.grade_level?.trim() || !formData.strand?.trim()) {
        toast.show('Please fill in all required fields', { type: 'error' });
        return;
      }

      console.log('Updating subject with data:', formData);

      const response = await fetchWithTimeout(`${API_URL}/subjects/${selectedSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          status: formData.status,
          gradeLevel: formData.grade_level.trim(),
          strand: formData.strand.trim(),
          description: formData.description?.trim() || '',
        }),
      });

      const data = await response.json();
      console.log('Update response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update subject');
      }

      // Update the subjects list with the new data
      setSubjects(prevSubjects => 
        prevSubjects.map(s => s.id === selectedSubject.id ? {
          ...data.subject,
          status: formData.status,
          grade_level: formData.grade_level,
          strand: formData.strand,
          description: formData.description?.trim() || '',
        } : s)
      );
      
      setIsEditModalVisible(false);
      setSelectedSubject(null);
      setFormData(INITIAL_FORM_DATA);
      toast.show('Subject updated successfully!', { type: 'success' });
    } catch (error: any) {
      console.error('Error updating subject:', error);
      let errorMessage = 'Failed to update subject. ';
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      toast.show(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithTimeout(`${API_URL}/subjects/${selectedSubject.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete subject');
      }

      setSubjects(subjects.filter(s => s.id !== selectedSubject.id));
      setIsDeleteModalVisible(false);
      toast.show('Subject deleted successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  const SubjectForm = ({ isEdit }: { isEdit: boolean }) => {
    const [localFormData, setLocalFormData] = useState<FormData>(isEdit ? formData : INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
      console.log('Changing field:', field, 'to value:', value);
      setLocalFormData(prev => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

    const validateForm = () => {
      const errors: Partial<FormData> = {};
      
      if (!localFormData.name?.trim()) {
        errors.name = 'Subject name is required';
      }
      if (!localFormData.code?.trim()) {
        errors.code = 'Subject code is required';
      }
      if (!localFormData.grade_level?.trim()) {
        errors.grade_level = 'Grade level is required';
      }
      if (!localFormData.strand?.trim()) {
        errors.strand = 'Strand is required';
      }

      setFormErrors(errors);
      console.log('Form validation errors:', errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
      console.log('Current form data:', localFormData);
      
      if (validateForm()) {
        const validatedData = {
          name: localFormData.name?.trim() || '',
          code: localFormData.code?.trim() || '',
          status: localFormData.status,
          gradeLevel: localFormData.grade_level?.trim() || '',
          strand: localFormData.strand?.trim() || '',
          description: localFormData.description?.trim() || '',
        };
        
        console.log('Submitting form data:', validatedData);
        
        try {
          setIsSubmitting(true);
          if (isEdit && selectedSubject) {
            // For editing existing subject
            const response = await fetchWithTimeout(`${API_URL}/subjects/${selectedSubject.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(validatedData),
            });

            const data = await response.json();
            console.log('Update response:', data);

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to update subject');
            }

            // Update the subjects list with the new data
            setSubjects(prevSubjects => 
              prevSubjects.map(s => s.id === selectedSubject.id ? {
                ...data.subject,
                status: formData.status,
                grade_level: formData.grade_level,
                strand: formData.strand,
                description: formData.description?.trim() || '',
              } : s)
            );
            setIsEditModalVisible(false);
            setSelectedSubject(null);
            setFormData(INITIAL_FORM_DATA);
            toast.show('Subject updated successfully!', { type: 'success' });
          } else {
            // For adding new subject
            const response = await fetchWithTimeout(`${API_URL}/subjects`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(validatedData),
            });

            const data = await response.json();
            console.log('Add response:', data);

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to add subject');
            }

            // Transform the response data to match our frontend structure
            const newSubject = {
              ...data.subject,
              grade_level: data.subject.gradeLevel,
              students: 0, // Initialize with 0 students
            };

            setSubjects([newSubject, ...subjects]);
            setIsAddModalVisible(false);
            setFormData(INITIAL_FORM_DATA);
            toast.show('Subject added successfully!', { type: 'success' });
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          toast.show('Failed to submit form. Please try again.', { type: 'error' });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        toast.show('Please fill in all required fields correctly', { type: 'error' });
      }
    };

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{isEdit ? 'Edit Subject' : 'Add Subject'}</Text>
          <TouchableOpacity
            onPress={() => {
              setFormErrors({});
              isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false);
            }}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Subject Name *</Text>
        <TextInput
          style={[styles.input, formErrors.name && styles.inputError]}
          value={localFormData.name}
          onChangeText={(text) => handleLocalChange('name', text)}
          placeholder="Enter subject name"
        />
        {formErrors.name && <Text style={styles.formErrorText}>{formErrors.name}</Text>}

        <Text style={styles.inputLabel}>Subject Code *</Text>
        <TextInput
          style={[styles.input, formErrors.code && styles.inputError]}
          value={localFormData.code}
          onChangeText={(text) => handleLocalChange('code', text)}
          placeholder="Enter subject code"
        />
        {formErrors.code && <Text style={styles.formErrorText}>{formErrors.code}</Text>}

        <Text style={styles.inputLabel}>Status</Text>
        <View style={[styles.pickerContainer, formErrors.status && styles.inputError]}>
          <Picker
            selectedValue={localFormData.status}
            onValueChange={(value: 'Available' | 'Unavailable') => handleLocalChange('status', value)}
            style={styles.picker}
          >
            {statuses.map((status) => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>
        </View>

        <Text style={styles.inputLabel}>Grade Level *</Text>
        <View style={[styles.pickerContainer, formErrors.grade_level && styles.inputError]}>
          <Picker
            selectedValue={localFormData.grade_level}
            onValueChange={(value: string) => handleLocalChange('grade_level', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Grade Level" value="" />
            {gradeLevels.map((level) => (
              <Picker.Item key={level} label={level} value={level} />
            ))}
          </Picker>
        </View>
        {formErrors.grade_level && <Text style={styles.formErrorText}>{formErrors.grade_level}</Text>}

        <Text style={styles.inputLabel}>Strand *</Text>
        <View style={[styles.pickerContainer, formErrors.strand && styles.inputError]}>
          <Picker
            selectedValue={localFormData.strand}
            onValueChange={(value: string) => handleLocalChange('strand', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Strand" value="" />
            {strands.map((strand) => (
              <Picker.Item key={strand} label={strand} value={strand} />
            ))}
          </Picker>
        </View>
        {formErrors.strand && <Text style={styles.formErrorText}>{formErrors.strand}</Text>}

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={localFormData.description}
          onChangeText={(text) => handleLocalChange('description', text)}
          placeholder="Enter description"
          multiline
        />

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setFormErrors({});
              isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : isEdit ? 'Update Subject' : 'Add Subject'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            value={searchQuery}
            onChangeText={handleSearch}
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
        <Text style={styles.title}>Subjects</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      {/* Subject List */}
      {loading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setRetryCount(0);
              fetchSubjects(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.teacherCard}>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{item.name || 'Unnamed Subject'}</Text>
                <Text style={{ color: '#888', fontSize: 13 }}>{item.code || 'No Code'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Grade Level:</Text>
                  <Text style={styles.detailValue}>{item.grade_level || 'Not Set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Strand:</Text>
                  <Text style={styles.detailValue}>{item.strand || 'Not Set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Students:</Text>
                  <Text style={styles.detailValue}>{item.students || 0}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditSubject(item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteSubject(item)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9' }]}
                  onPress={() => handleViewSubject(item)}
                >
                  <MaterialIcons name="visibility" size={20} color="#1976D2" />
                  <Text style={{ color: '#1976D2', marginLeft: 6 }}>View</Text>
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
                <Text style={styles.loadingMoreText}>Loading more subjects...</Text>
              </View>
            ) : null
          )}
          contentContainerStyle={styles.teacherList}
        />
      )}
      {/* Add Subject Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <SubjectForm isEdit={false} />
        </View>
      </Modal>
      {/* Edit Subject Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <SubjectForm isEdit={true} />
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
            <Text style={styles.deleteTitle}>Are you sure you want to delete this subject?</Text>
            <Text style={styles.deleteMessage}>
              This action cannot be undone. This will permanently delete the subject record from the database.
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
      {/* View Subject Modal */}
      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          {selectedSubject && (
            <View style={[styles.formContainer, { maxWidth: 400, alignSelf: 'center' }]}> 
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Subject Details</Text>
                <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.viewDetailsContainer}>
                <Text style={styles.viewSubjectName}>{selectedSubject.name || 'No Name'}</Text>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedSubject.status) }]}>
                  <Text style={styles.statusText}>{selectedSubject.status}</Text>
                </View>

                <View style={styles.viewDetailRow}>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>ID</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.id || 'N/A'}</Text>
                  </View>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>Subject Code</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.code || 'Not Set'}</Text>
                  </View>
                </View>

                <View style={styles.viewDetailRow}>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>Grade Level</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.grade_level || 'Not Set'}</Text>
                  </View>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>Strand</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.strand || 'Not Set'}</Text>
                  </View>
                </View>

                <View style={styles.viewDetailRow}>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>Enrolled Students</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.students || 0} students</Text>
                  </View>
                  <View style={styles.viewDetailColumn}>
                    <Text style={styles.viewDetailLabel}>Status</Text>
                    <Text style={styles.viewDetailValue}>{selectedSubject.status || 'Not Set'}</Text>
                  </View>
                </View>

                <View style={styles.viewDescriptionContainer}>
                  <Text style={styles.viewDetailLabel}>Description</Text>
                  <Text style={styles.viewDescriptionText}>
                    {selectedSubject.description || 'No description available'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.submitButton, { marginTop: 16 }]} 
                  onPress={() => setIsViewModalVisible(false)}
                >
                  <Text style={styles.submitButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

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
    width: '100%',
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
  teacherDetails: {
    flex: 1,
    width: '100%',
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
    width: '100%',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
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
  submitButtonDisabled: {
    backgroundColor: '#ccc',
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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  formErrorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  viewDetailsContainer: {
    padding: 16,
  },
  viewSubjectName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  viewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewDetailColumn: {
    flex: 1,
    marginRight: 16,
  },
  viewDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  viewDetailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  viewDescriptionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  viewDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
});

export default SubjectsScreen;
