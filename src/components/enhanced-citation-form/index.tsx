import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2 } from 'lucide-react';

interface BibEntry {
  sourceType: 'book' | 'journal' | 'website' | 'newspaper' | 'chapter';
  author: string;
  title: string;
  year: string;
  doi: string;
  url: string;
  accessDate: string;
  publisher: string;
  city: string;
  edition: string;
  journalName: string;
  volume: string;
  issue: string;
  pages: string;
  websiteName: string;
  organization: string;
  newspaperName: string;
  bookTitle: string;
  editors: string;
  chapterPages: string;
}

const STORAGE_KEY = 'citation-entries';

// Helper to check if an entry is complete based on source type
const isEntryComplete = (entry: BibEntry): boolean => {
  const baseRequired = entry.author.trim() && entry.title.trim() && entry.year.trim();
  
  switch (entry.sourceType) {
    case 'book':
      return baseRequired && entry.publisher.trim() && entry.city.trim();
    case 'journal':
      return baseRequired && entry.journalName.trim() && entry.volume.trim() && entry.issue.trim();
    case 'website':
      return baseRequired && entry.websiteName.trim() && entry.organization.trim() && entry.url.trim();
    case 'chapter':
      return baseRequired && entry.bookTitle.trim() && entry.editors.trim() && entry.publisher.trim();
    default:
      return baseRequired;
  }
};

const EnhancedCitationForm = ({
  bibEntry,
  setBibEntry,
  sourceType,
}: {
  bibEntry: BibEntry;
  setBibEntry: (entry: BibEntry) => void;
  sourceType: BibEntry['sourceType'];
}) => {
  const [entries, setEntries] = useState<{ [key: string]: BibEntry[] }>({});
  const [currentField, setCurrentField] = useState<keyof BibEntry | null>(null);
  const [prediction, setPrediction] = useState<BibEntry | null>(null);
  const [showAutoFillHint, setShowAutoFillHint] = useState(false);
  const [lastTabTime, setLastTabTime] = useState<number>(0);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const lastCompletedRef = useRef<BibEntry | null>(null);

  // Load entries on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        setEntries(parsed);
      } catch (error) {
        console.error('Error loading entries:', error);
      }
    }
  }, []);

  // Save entries when they change
  useEffect(() => {
    if (Object.keys(entries).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  // Save complete entry
  const saveEntry = (entry: BibEntry) => {
    // Don't save if it's the same as the last completed entry
    if (JSON.stringify(entry) === JSON.stringify(lastCompletedRef.current)) {
      return;
    }

    if (isEntryComplete(entry)) {
      lastCompletedRef.current = entry;
      setEntries(prev => {
        const sourceEntries = prev[sourceType] || [];
        const exists = sourceEntries.some(
          e => e.author === entry.author && e.title === entry.title
        );

        if (!exists) {
          return {
            ...prev,
            [sourceType]: [{ ...entry }, ...sourceEntries].slice(0, 10)
          };
        }
        return prev;
      });
    }
  };

  // Update entries when bibEntry changes
  useEffect(() => {
    saveEntry(bibEntry);
  }, [bibEntry]);

  // Find best matching entry
  const findMatch = (field: keyof BibEntry, value: string): BibEntry | null => {
    if (!value.trim() || !entries[sourceType]) return null;

    const matches = entries[sourceType]?.filter(entry => {
      const fieldValue = String(entry[field] || '');
      return fieldValue.toLowerCase().startsWith(value.toLowerCase());
    });

    if (matches?.length > 0) {
      return matches[0];
    }

    return null;
  };

  // Handle field changes
  const handleFieldChange = (field: keyof BibEntry, value: string) => {
    setBibEntry(prev => ({ ...prev, [field]: value }));
    
    const match = findMatch(field, value);
    if (match && match[field] !== value) {
      setPrediction(match);
    } else {
      setPrediction(null);
    }
  };

  // Complete current field
  const completeCurrentField = (field: keyof BibEntry) => {
    if (!prediction) return false;
    
    const predictedValue = prediction[field];
    if (predictedValue && String(predictedValue).toLowerCase().startsWith(String(bibEntry[field]).toLowerCase())) {
      setBibEntry(prev => ({
        ...prev,
        [field]: predictedValue
      }));
      return true;
    }
    return false;
  };

  // Complete all fields
  const completeAllFields = () => {
    if (!prediction) return;
    
    setBibEntry(prev => ({
      ...prediction,
      sourceType: prev.sourceType
    }));
    setPrediction(null);
    setShowAutoFillHint(true);
    setTimeout(() => setShowAutoFillHint(false), 2000);
  };

  // Handle tab completion
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof BibEntry) => {
    if (e.key === 'Tab' && !e.shiftKey && prediction) {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastTabTime < 300) {
        completeAllFields();
      } else {
        if (completeCurrentField(field)) {
          const inputs = Object.values(inputRefs.current).filter(Boolean);
          const currentIndex = inputs.indexOf(inputRefs.current[field]);
          const nextInput = inputs[currentIndex + 1];
          if (nextInput) {
            nextInput.focus();
          }
        }
      }
      setLastTabTime(now);
    }
  };

  const renderField = (field: keyof BibEntry, label: string, required: boolean = false) => {
    const predictedValue = prediction?.[field];
    const currentValue = bibEntry[field];

    return (
      <div className="space-y-1">
        <label className="text-sm text-gray-600">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <Input
            ref={el => inputRefs.current[field] = el}
            value={currentValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, field)}
            onFocus={() => {
              setCurrentField(field);
              if (currentValue) {
                const match = findMatch(field, currentValue);
                setPrediction(match);
              }
            }}
            onBlur={() => setCurrentField(null)}
            className="w-full"
            required={required}
          />

          {/* Gray predictive text */}
          {predictedValue && currentValue && String(predictedValue).toLowerCase().startsWith(String(currentValue).toLowerCase()) && (
            <div 
              className="absolute inset-0 flex items-center px-3 pointer-events-none text-gray-400 bg-transparent"
              style={{ 
                paddingLeft: `${String(currentValue).length * 0.61}em`
              }}
            >
              {String(predictedValue).slice(String(currentValue).length)}
            </div>
          )}

          {/* Mobile dropdown */}
          {currentField === field && prediction && predictedValue && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
              <div
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={completeAllFields}
              >
                Complete with: {predictedValue}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 relative">
      {showAutoFillHint && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Fields auto-filled!</span>
        </div>
      )}

      {prediction && (
        <Button
          onClick={completeAllFields}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md ml-auto"
        >
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">Complete Entry</span>
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('author', 'Author (Last Name, First Name)', true)}
        {renderField('title', 'Title', true)}
        {renderField('year', 'Year', true)}
        {renderField('pages', 'Pages')}

        {sourceType === 'book' && (
          <>
            {renderField('publisher', 'Publisher', true)}
            {renderField('city', 'City of Publication', true)}
            {renderField('edition', 'Edition')}
          </>
        )}

        {sourceType === 'journal' && (
          <>
            {renderField('journalName', 'Journal Name', true)}
            {renderField('volume', 'Volume', true)}
            {renderField('issue', 'Issue', true)}
          </>
        )}

        {sourceType === 'website' && (
          <>
            {renderField('websiteName', 'Website Name', true)}
            {renderField('organization', 'Organization', true)}
            {renderField('url', 'URL', true)}
            {renderField('accessDate', 'Access Date', true)}
          </>
        )}

        {sourceType === 'chapter' && (
          <>
            {renderField('bookTitle', 'Book Title', true)}
            {renderField('editors', 'Editor(s)', true)}
            {renderField('publisher', 'Publisher', true)}
            {renderField('chapterPages', 'Chapter Pages', true)}
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedCitationForm;