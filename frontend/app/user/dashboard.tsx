import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Bell, Clock, GraduationCap, LogOut, X } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from '../context/AuthContext';

declare namespace JSX {
  interface Element {}
}

export default function Dashboard(): JSX.Element {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const { setUser } = useAuth();
  const router = useRouter();

  // Responsive helpers
  const isSmallScreen = width < 400;
  const isMediumScreen = width < 700;

  const studentInfo = {
    name: "Alex Chen",
    email: "alex.chen@student.edu",
    gender: "Male",
    birthplace: "San Francisco, CA",
    birthdate: "2007-08-15",
    grade: "Grade 10",
    section: "Section A",
    studentId: "ST-001",
    enrollmentDate: "2023-06-15",
    lastLogin: "2025-04-01 03:45 PM",
    status: "Active",
    guardian: {
      name: "Wei Chen",
      contact: "+1-555-123-4567",
      relationship: "Father"
    }
  };

  const subjects = [
    { name: "Mathematics", q1: 92, q2: 88, q3: 90, q4: 94, final: 91, teacher: "Mrs. Johnson", time: "8:00 AM - 9:30AM" },
    { name: "Science", q1: 85, q2: 82, q3: 88, q4: 86, final: 85, teacher: "Mr. Williams", time: "9:45 AM - 11:15 AM" },
    { name: "English", q1: 95, q2: 94, q3: 92, q4: 96, final: 94, teacher: "Ms. Davis", time: "1:00 PM - 2:30 PM" },
    { name: "History", q1: 89, q2: 91, q3: 87, q4: 90, final: 89, teacher: "Mr. Brown", time: "2:45 PM - 4:15 PM" }
  ];

  // Handler for picking a new profile image
  const handleChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Handler for logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear user data
            setUser(null);
            // Redirect to login page
            router.replace('/login');
          }
        }
      ]
    );
  };

  // Add the handler at the top of the component
  const handleDownloadSchedule = () => {
    alert('Download Schedule button pressed!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isSmallScreen && { paddingVertical: 16, paddingHorizontal: 8 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, isSmallScreen && { fontSize: 18 }]}>Good Evening, {studentInfo.name}!</Text>
            <Text style={[styles.headerSubtitle, isSmallScreen && { fontSize: 12 }]}>Welcome to your student dashboard</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>3</Text></View>
              <Bell size={isSmallScreen ? 20 : 24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.notificationButton, { marginLeft: 8 }]} onPress={handleLogout}>
              <LogOut size={isSmallScreen ? 20 : 24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContent, isSmallScreen && { padding: 8 }]}>
        {/* Stats Cards */}
        <View style={[styles.statsRow, isSmallScreen && { flexDirection: 'column', gap: 8 }]}>
          <Card>
            <CardContent>
              <View style={styles.statsCardContent}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }, isSmallScreen && { padding: 8 }]}> 
                  <Bell size={isSmallScreen ? 18 : 24} color="#3B82F6" />
                </View>
                <View>
                  <Text style={[styles.statsLabel, isSmallScreen && { fontSize: 12 }]}>Subjects Enrolled</Text>
                  <Text style={[styles.statsValue, isSmallScreen && { fontSize: 16 }]}>4</Text>
                </View>
              </View>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <View style={styles.statsCardContent}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }, isSmallScreen && { padding: 8 }]}> 
                  <GraduationCap size={isSmallScreen ? 18 : 24} color="#22C55E" />
                </View>
                <View>
                  <Text style={[styles.statsLabel, isSmallScreen && { fontSize: 12 }]}>Current Grade</Text>
                  <Text style={[styles.statsValue, isSmallScreen && { fontSize: 16 }]}>Grade 10</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
        {/* Tabs (no outer Card container) */}
        <Tabs defaultValue={activeTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardContent>
                <View style={[styles.profileRow, isSmallScreen && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <Image
                    source={{ uri: profileImage || "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg" }}
                    style={[styles.profileImage, isSmallScreen && { width: 60, height: 60, borderRadius: 30, marginRight: 0, marginBottom: 8 }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, isSmallScreen && { fontSize: 16 }]}>{studentInfo.name}</Text>
                    <Text style={[styles.profileEmail, isSmallScreen && { fontSize: 12 }]}>{studentInfo.email}</Text>
                  </View>
                </View>
                <View style={[styles.infoGrid, isSmallScreen && { flexDirection: 'column', gap: 12 }]}>
                  <View style={[styles.infoBlock, styles.profileInfoCard]}>
                    <Text style={[styles.infoTitle, isSmallScreen && { fontSize: 14 }]}>Personal Information</Text>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Gender: </Text><Text>{studentInfo.gender}</Text></View>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Birthplace: </Text><Text>{studentInfo.birthplace}</Text></View>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Student ID: </Text><Text>{studentInfo.studentId}</Text></View>
                    <Button onPress={() => setIsEditProfileOpen(true)} title="Edit Profile" variant="default" />
                  </View>
                  <View style={[styles.infoBlock, styles.profileInfoCard]}>
                    <Text style={[styles.infoTitle, isSmallScreen && { fontSize: 14 }]}>Guardian Information</Text>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Name: </Text><Text>{studentInfo.guardian.name}</Text></View>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Contact: </Text><Text>{studentInfo.guardian.contact}</Text></View>
                    <View style={styles.infoItem}><Text style={[styles.infoLabel, isSmallScreen && { fontSize: 12 }]}>Relationship: </Text><Text>{studentInfo.guardian.relationship}</Text></View>
                  </View>
                </View>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="classes">
            <Card>
              <CardContent>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, isSmallScreen && { fontSize: 14 }]}>Class Schedule</Text>
                  <Input placeholder="Search classes or teachers..." />
                </View>
                <Button title="Download Schedule" variant="outline" onPress={handleDownloadSchedule} />
                {subjects.map((subject, index) => (
                  <Card key={index}>
                    <CardContent>
                      <View style={[styles.classRow, isSmallScreen && { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}> 
                        <View>
                          <Text style={[styles.className, isSmallScreen && { fontSize: 14 }]}>{subject.name}</Text>
                          <View style={styles.classTimeRow}>
                            <Clock size={isSmallScreen ? 12 : 16} color="#6B7280" />
                            <Text style={[styles.classTime, isSmallScreen && { fontSize: 11 }]}>{subject.time}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: isSmallScreen ? 'flex-start' : 'flex-end', marginTop: isSmallScreen ? 4 : 0 }}>
                          <Text style={[styles.classTeacherLabel, isSmallScreen && { fontSize: 11 }]}>Teacher</Text>
                          <Text>{subject.teacher}</Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="grades">
            <Card>
              <CardContent>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, isSmallScreen && { fontSize: 14 }]}>Report Card</Text>
                  <Button title="Download Report Card" variant="outline" onPress={() => {}} size={isSmallScreen ? 'sm' : 'md'} />
                </View>
                {subjects.map((subject, index) => (
                  <Card key={index}>
                    <CardContent>
                      <View style={styles.gradeCard}>
                        <View style={styles.gradeHeader}>
                          <Text style={[styles.gradeSubject, isSmallScreen && { fontSize: 14 }]}>{subject.name}</Text>
                          <Text style={[styles.gradeTeacher, isSmallScreen && { fontSize: 11 }]}>{subject.teacher}</Text>
                        </View>
                        <View style={[styles.gradeGrid, isSmallScreen && { gap: 4 }]}>
                          <View style={[styles.gradeBlock, isSmallScreen && { width: '30%', padding: 8 }]}><Text style={[styles.gradeLabel, isSmallScreen && { fontSize: 10 } ]}>Q1</Text><Text style={[styles.gradeValue, isSmallScreen && { fontSize: 14 }]}>{subject.q1}</Text></View>
                          <View style={[styles.gradeBlock, isSmallScreen && { width: '30%', padding: 8 }]}><Text style={[styles.gradeLabel, isSmallScreen && { fontSize: 10 } ]}>Q2</Text><Text style={[styles.gradeValue, isSmallScreen && { fontSize: 14 }]}>{subject.q2}</Text></View>
                          <View style={[styles.gradeBlock, isSmallScreen && { width: '30%', padding: 8 }]}><Text style={[styles.gradeLabel, isSmallScreen && { fontSize: 10 } ]}>Q3</Text><Text style={[styles.gradeValue, isSmallScreen && { fontSize: 14 }]}>{subject.q3}</Text></View>
                          <View style={[styles.gradeBlock, isSmallScreen && { width: '30%', padding: 8 }]}><Text style={[styles.gradeLabel, isSmallScreen && { fontSize: 10 } ]}>Q4</Text><Text style={[styles.gradeValue, isSmallScreen && { fontSize: 14 }]}>{subject.q4}</Text></View>
                          <View style={[styles.gradeBlockFinal, isSmallScreen && { width: '64%', padding: 8 }]}><Text style={[styles.gradeLabelFinal, isSmallScreen && { fontSize: 11 } ]}>Final Grade</Text><Text style={[styles.gradeValueFinal, isSmallScreen && { fontSize: 16 }]}>{subject.final}</Text></View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollView>
      {/* Edit Profile Modal */}
      <Dialog visible={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <TouchableOpacity onPress={() => setIsEditProfileOpen(false)} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </DialogHeader>
          <View style={styles.editProfileImageBlock}>
            <Image
              source={{ uri: profileImage || "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg" }}
              style={[styles.editProfileImage, isSmallScreen && { width: 72, height: 72, borderRadius: 36 }]}
            />
            <Button title="Change Photo" variant="outline" size={isSmallScreen ? 'sm' : 'md'} onPress={handleChangePhoto} />
          </View>
          <View style={styles.editProfileForm}>
            <Text style={[styles.inputLabel, isSmallScreen && { fontSize: 12 }]}>Full Name</Text>
            <Input defaultValue={studentInfo.name} />
            <Text style={[styles.inputLabel, isSmallScreen && { fontSize: 12 }]}>Email</Text>
            <Input defaultValue={studentInfo.email} />
            <Text style={[styles.inputLabel, isSmallScreen && { fontSize: 12 }]}>Gender</Text>
            <Input defaultValue={studentInfo.gender} />
            <Text style={[styles.inputLabel, isSmallScreen && { fontSize: 12 }]}>Birthplace</Text>
            <Input defaultValue={studentInfo.birthplace} />
            <Text style={[styles.inputLabel, isSmallScreen && { fontSize: 12 }]}>Birthdate</Text>
            <Input defaultValue={studentInfo.birthdate} />
            {/* File upload and other web-only features omitted for RN */}
            <View style={[styles.editProfileActions, isSmallScreen && { gap: 8 }]}>
              <Button title="Cancel" variant="outline" onPress={() => setIsEditProfileOpen(false)} size={isSmallScreen ? 'sm' : 'md'} />
              <Button title="Save changes" onPress={() => setIsEditProfileOpen(false)} size={isSmallScreen ? 'sm' : 'md'} />
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    padding: 12,
    borderRadius: 999,
    marginRight: 8,
  },
  statsLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    color: '#6B7280',
    fontSize: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  infoBlock: {
    flex: 1,
    marginRight: 12,
  },
  profileInfoCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginRight: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  classTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  classTime: {
    color: '#6B7280',
    fontSize: 13,
    marginLeft: 4,
  },
  classTeacherLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 2,
  },
  gradeCard: {
    marginBottom: 12,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gradeSubject: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2563EB',
  },
  gradeTeacher: {
    color: '#6B7280',
    fontSize: 13,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeBlock: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '22%',
    marginBottom: 8,
  },
  gradeBlockFinal: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  gradeLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
  },
  gradeLabelFinal: {
    color: '#2563EB',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  gradeValueFinal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  editProfileImageBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editProfileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
  },
  editProfileForm: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
    color: '#374151',
  },
  editProfileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editProfileButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  cancelButton: {
    marginRight: 8,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
}); 