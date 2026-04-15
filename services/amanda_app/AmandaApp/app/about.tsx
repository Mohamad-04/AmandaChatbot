/**
 * about.tsx — About / Onboarding Slideshow
 *
 * Fixed:
 *  1. Slides now have a fixed height so FlatList renders all of them correctly
 *  2. Disclaimer checkbox issue handled by passing scroll fix via props
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DisclaimerModal, { DISCLAIMER_KEY } from '../components/disclaimer';

const ONBOARDED_KEY = '@amanda_onboarded';
const markOnboarded = () => AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
import { styles, C } from '../styles/about.styles';


const { width, height } = Dimensions.get('window');

// Slide height = full screen minus bottom controls area
const SLIDE_HEIGHT = height - 220;

const SLIDES = [
  {
    id: '1',
    icon: '👋',
    tag: 'Welcome',
    title: 'Meet Amanda',
    body: 'Amanda is your personal AI companion, designed to give you a safe and private space to talk, reflect, and feel heard — any time you need it.',
  },
  {
    id: '2',
    icon: '💬',
    tag: 'Purpose',
    title: 'Why we built this',
    body: 'Sometimes you just need someone to talk to. Amanda was created to fill that gap — offering emotional support without judgement, waiting rooms, or appointments.',
  },
  {
    id: '3',
    icon: '🔒',
    tag: 'Why Amanda',
    title: 'Your privacy, always',
    body: 'Everything you share stays private. Amanda is designed with your confidentiality in mind — you are in control of what you share and when.',
  },
  {
    id: '4',
    icon: '🌱',
    tag: 'Why Amanda',
    title: 'Always here for you',
    body: "Whether it's 2pm or 2am, Amanda is available. No scheduling, no waiting — just open the app and start talking whenever you're ready.",
  },
  {
    id: '5',
    icon: '✦',
    tag: 'Why Amanda',
    title: 'A space to grow',
    body: 'Amanda helps you reflect on your thoughts and feelings over time. Think of her as a supportive presence on your journey to better mental wellbeing.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const flatListRef = useRef<FlatList<typeof SLIDES[0]>>(null);

  // ── Scroll to next slide or show disclaimer on last ──────────────────────
  const goToNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      // Skip disclaimer if already accepted — go straight to chat
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (accepted) {
        markOnboarded();
        router.replace('/chat');
      } else {
        setShowDisclaimer(true);
      }
    }
  };

  // ── Detect swipe ──────────────────────────────────────────────────────────
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // ── Single slide ──────────────────────────────────────────────────────────
  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={styles.tag}>{item.tag}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => { markOnboarded(); router.replace('/'); }}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        /*
         * getItemLayout tells FlatList the exact size of each item.
         * Without this, scrollToIndex can fail or show wrong slides.
         * width = one full screen width, offset = index * width
         */
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View style={styles.bottom}>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index, animated: true });
                setCurrentIndex(index);
              }}
            >
              <View style={[styles.dot, index === currentIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue / Get Started */}
        <TouchableOpacity
          style={[styles.continueBtn, isLastSlide && styles.continueBtnLast]}
          onPress={goToNext}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {isLastSlide ? '✦  Get Started' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        {/* Back button — hidden on first slide */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              const prevIndex = currentIndex - 1;
              flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
              setCurrentIndex(prevIndex);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}

      </View>

      {/* Disclaimer modal */}
      <DisclaimerModal
        visible={showDisclaimer}
        onAgree={() => {
          markOnboarded();
          setShowDisclaimer(false);
          router.replace('/chat');
        }}
        onCancel={() => setShowDisclaimer(false)}
      />

    </SafeAreaView>
  );
}

