"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coffee, PlusCircle, Save, FileDown, X, ArrowUp, ArrowDown } from 'lucide-react';

// Type definitions
type SourceType = 'book' | 'journal' | 'website' | 'newspaper' | 'chapter';
type CitationStyle = 'turabian' | 'apa' | 'mla' | 'chicago' | 'ieee';
type BibEntryKey = keyof BibEntry;

interface BibEntry {
  sourceType: SourceType;
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

interface ResearchEntry {
  id: string;
  pointId: string;
  text: string;
  bibliography: BibEntry;
}

interface OutlinePoint {
  id: string;
  text: string;
  level: 'main' | 'sub';
  children: OutlinePoint[];
}

const calculateStorageSize = (thesis: string, outlinePoints: any[], researchEntries: any[]) => {
  const data = JSON.stringify({
    thesis,
    outlinePoints,
    researchEntries
  });
  return (new Blob([data]).size) / (1024 * 1024);
};

const STORAGE_LIMIT = 4.5;
const MAX_STORAGE = 5;

const ResearchPaperOrganizer = () => {
  // State management
  const currentDate = new Date().toISOString().split('T')[0];
  const [thesis, setThesis] = useState('');
  const [outlinePoints, setOutlinePoints] = useState<OutlinePoint[]>([]);
  const [currentPointText, setCurrentPointText] = useState('');
  type Level = 'main' | 'sub';
  const [currentLevel, setCurrentLevel] = useState<Level>('main');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedPointId, setSelectedPointId] = useState('');
  const [researchText, setResearchText] = useState('');
  const [researchEntries, setResearchEntries] = useState<ResearchEntry[]>([]);
  const [storageWarning, setStorageWarning] = useState<string>('');
  const [storagePercentage, setStoragePercentage] = useState(0);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('turabian');

  // Empty bibliography entry template
  const emptyBibEntry: BibEntry = {
    sourceType: 'book',
    author: '',
    title: '',
    year: '',
    doi: '',
    url: '',
    accessDate: currentDate,
    publisher: '',
    city: '',
    edition: '',
    journalName: '',
    volume: '',
    issue: '',
    pages: '',
    websiteName: '',
    organization: '',
    newspaperName: '',
    bookTitle: '',
    editors: '',
    chapterPages: ''
  };

  // Bibliography state
  const [bibEntry, setBibEntry] = useState<BibEntry>(emptyBibEntry);

  // Styles
  const styles = {
    container: "bg-[#F5E6D3] min-h-screen p-6",
    card: "bg-[#FFF9F0] shadow-lg",
    input: "bg-white border-[#D4BFA0]",
    button: "bg-[#8B593E] hover:bg-[#6D4331] text-white",
    heading: "text-[#4A2B1B]",
    text: "text-[#4A2B1B]",
    tabs: "bg-white shadow-sm rounded-lg p-1",
    tabsTrigger: "data-[state=active]:bg-[#8B593E] data-[state=active]:text-white px-4 py-2 rounded-md transition-all",
    select: "bg-white",
    selectContent: "bg-white border shadow-lg rounded-md overflow-hidden z-50",
    deleteButton: "text-red-500 hover:text-red-700",
    bibliographySection: "bg-white p-4 rounded-lg border border-[#D4BFA0]"
  };
  // Load data on mount
  useEffect(() => {
    try {
      const savedThesis = localStorage.getItem('thesis');
      const savedOutlinePoints = localStorage.getItem('outlinePoints');
      const savedResearchEntries = localStorage.getItem('researchEntries');

      if (savedThesis) setThesis(savedThesis);
      if (savedOutlinePoints) setOutlinePoints(JSON.parse(savedOutlinePoints));
      if (savedResearchEntries) setResearchEntries(JSON.parse(savedResearchEntries));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Check storage size
  useEffect(() => {
    const currentSize = calculateStorageSize(thesis, outlinePoints, researchEntries);
    const percentage = (currentSize / MAX_STORAGE) * 100;
    setStoragePercentage(Math.min(percentage, 100));

    if (currentSize >= MAX_STORAGE) {
      setStorageWarning("Storage limit reached. Please export your work to continue.");
    } else if (currentSize >= STORAGE_LIMIT) {
      setStorageWarning(`You're approaching the storage limit. Consider exporting your work to ensure nothing is lost.`);
    } else {
      setStorageWarning("");
    }
  }, [thesis, outlinePoints, researchEntries]);

  // Save effects
  useEffect(() => {
    try {
      localStorage.setItem('thesis', thesis);
    } catch (error) {
      setStorageWarning('Unable to save changes. Please export your work.');
    }
  }, [thesis]);

  useEffect(() => {
    try {
      localStorage.setItem('outlinePoints', JSON.stringify(outlinePoints));
    } catch (error) {
      setStorageWarning('Unable to save changes. Please export your work.');
    }
  }, [outlinePoints]);

  useEffect(() => {
    try {
      localStorage.setItem('researchEntries', JSON.stringify(researchEntries));
    } catch (error) {
      setStorageWarning('Unable to save changes. Please export your work.');
    }
  }, [researchEntries]);
  // Function to format citations for each style
  const formatCitation = (bib: BibEntry, style: CitationStyle): string => {
    switch (style) {
      case 'turabian':
        switch (bib.sourceType) {
          case 'book':
            return `${bib.author}. ${bib.title}. ${bib.city}: ${bib.publisher}${bib.edition ? `, ${bib.edition} edition` : ''}, ${bib.year}.${bib.doi ? ` DOI: ${bib.doi}` : ''}`;
          case 'journal':
            return `${bib.author}. "${bib.title}." ${bib.journalName} ${bib.volume}, no. ${bib.issue} (${bib.year}): ${bib.pages}.${bib.doi ? ` DOI: ${bib.doi}` : ''}`;
          case 'website':
            return `${bib.author}. "${bib.title}." ${bib.websiteName}. ${bib.organization}. ${bib.url} (accessed ${new Date(bib.accessDate).toLocaleDateString()}).`;
          case 'chapter':
            return `${bib.author}. "${bib.title}." In ${bib.bookTitle}, edited by ${bib.editors}, ${bib.chapterPages}. ${bib.city}: ${bib.publisher}, ${bib.year}.`;
          case 'newspaper':
            return `${bib.author}. "${bib.title}." ${bib.newspaperName}, ${bib.year}${bib.pages ? `, ${bib.pages}` : ''}.`;
          default:
            return '';
        }

      case 'apa':
        switch (bib.sourceType) {
          case 'book':
            return `${bib.author}. (${bib.year}). ${bib.title}${bib.edition ? ` (${bib.edition} ed.)` : ''}. ${bib.publisher}.${bib.doi ? ` https://doi.org/${bib.doi}` : ''}`;
          case 'journal':
            return `${bib.author}. (${bib.year}). ${bib.title}. ${bib.journalName}, ${bib.volume}(${bib.issue}), ${bib.pages}.${bib.doi ? ` https://doi.org/${bib.doi}` : ''}`;
          case 'website':
            return `${bib.author}. (${bib.year}). ${bib.title}. ${bib.websiteName}. ${bib.url}`;
          case 'chapter':
            return `${bib.author}. (${bib.year}). ${bib.title}. In ${bib.editors} (Ed.), ${bib.bookTitle} (pp. ${bib.chapterPages}). ${bib.publisher}.`;
          case 'newspaper':
            return `${bib.author}. (${bib.year}). ${bib.title}. ${bib.newspaperName}${bib.pages ? `, ${bib.pages}` : ''}.`;
          default:
            return '';
        }

      case 'mla':
        switch (bib.sourceType) {
          case 'book':
            return `${bib.author}. ${bib.title}. ${bib.publisher}, ${bib.year}.`;
          case 'journal':
            return `${bib.author}. "${bib.title}." ${bib.journalName}, vol. ${bib.volume}, no. ${bib.issue}, ${bib.year}, pp. ${bib.pages}.`;
          case 'website':
            return `${bib.author}. "${bib.title}." ${bib.websiteName}, ${bib.organization}, ${new Date(bib.accessDate).toLocaleDateString()}, ${bib.url}.`;
          case 'chapter':
            return `${bib.author}. "${bib.title}." ${bib.bookTitle}, edited by ${bib.editors}, ${bib.publisher}, ${bib.year}, pp. ${bib.chapterPages}.`;
          case 'newspaper':
            return `${bib.author}. "${bib.title}." ${bib.newspaperName}, ${bib.year}, p. ${bib.pages}.`;
          default:
            return '';
        }

      case 'chicago':
        // Similar to Turabian but with slight variations
        return formatCitation(bib, 'turabian');

      case 'ieee':
        switch (bib.sourceType) {
          case 'book':
            return `${bib.author}, ${bib.title}, ${bib.edition ? `${bib.edition} ed., ` : ''}${bib.city}: ${bib.publisher}, ${bib.year}.`;
          case 'journal':
            return `${bib.author}, "${bib.title}," ${bib.journalName}, vol. ${bib.volume}, no. ${bib.issue}, pp. ${bib.pages}, ${bib.year}.`;
          case 'website':
            return `${bib.author}, "${bib.title}," ${bib.websiteName}. ${bib.organization}. [Online]. Available: ${bib.url} [Accessed: ${new Date(bib.accessDate).toLocaleDateString()}]`;
          case 'chapter':
            return `${bib.author}, "${bib.title}," in ${bib.bookTitle}, ${bib.editors}, Ed. ${bib.city}: ${bib.publisher}, ${bib.year}, pp. ${bib.chapterPages}.`;
          case 'newspaper':
            return `${bib.author}, "${bib.title}," ${bib.newspaperName}, ${bib.year}, p. ${bib.pages}.`;
          default:
            return '';
        }

      default:
        return '';
    }
  };

  // Handler functions
  const handleAddPoint = () => {
    if (!currentPointText.trim()) return;

    const newPoint = {
      id: Date.now().toString(),
      text: currentPointText,
      level: currentLevel,
      children: []
    };

    if (currentLevel === 'main') {
      setOutlinePoints([...outlinePoints, newPoint]);
    } else {
      const updatedPoints = outlinePoints.map(point => {
        if (point.id === selectedParentId) {
          return {
            ...point,
            children: [...point.children, newPoint]
          };
        }
        return point;
      });
      setOutlinePoints(updatedPoints);
    }

    setCurrentPointText('');
  };

  const handleDeletePoint = (pointId: string, parentId: string | null = null) => {
    if (parentId) {
      setOutlinePoints(outlinePoints.map(point => {
        if (point.id === parentId) {
          return {
            ...point,
            children: point.children.filter(child => child.id !== pointId)
          };
        }
        return point;
      }));
    } else {
      setOutlinePoints(outlinePoints.filter(point => point.id !== pointId));
    }
    setResearchEntries(researchEntries.filter(entry => entry.pointId !== pointId));
  };

  const movePoint = (index: number, direction: 'up' | 'down') => {
    const newPoints = [...outlinePoints];
    if (direction === 'up' && index > 0) {
      [newPoints[index], newPoints[index - 1]] = [newPoints[index - 1], newPoints[index]];
    } else if (direction === 'down' && index < newPoints.length - 1) {
      [newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]];
    }
    setOutlinePoints(newPoints);
  };

  const handleAddResearch = () => {
    if (!selectedPointId || !researchText.trim()) return;

    const newEntry = {
      id: Date.now().toString(),
      pointId: selectedPointId,
      text: researchText,
      bibliography: { ...bibEntry }
    };

    setResearchEntries([...researchEntries, newEntry]);
    setResearchText('');
    setBibEntry(emptyBibEntry);
  };

  const handleExport = () => {
    const content = `
    <html>
    <head>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 0.5in 0.5in 0.5in 0.5in;
          padding: 0;
        }
        h1 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 0;
          margin-bottom: 1em;
          text-align: center;
        }
        p {
          margin: 0 0 0.5em 0;
        }
        .thesis {
          margin-bottom: 1em;
        }
        .research-entry {
          margin-left: 0.25in;
          margin-bottom: 0.5em;
        }
        .citation {
          margin-left: 0.25in;
          font-style: italic;
          margin-bottom: 1em;
        }
        h2, h3 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .bibliography {
          margin-top: 2em;
        }
        .bibliography-entry {
          padding-left: 0.5in;
          text-indent: -0.5in;
          margin-bottom: 1em;
        }
      </style>
    </head>
    <body>
      <h1>Research Paper Outline</h1>
      <p class="thesis"><strong>Thesis:</strong> ${thesis}</p>
      
      ${outlinePoints.map((point, index) => `
        <h2>${index + 1}. ${point.text}</h2>
        ${researchEntries
        .filter(entry => entry.pointId === point.id)
        .map(entry => `
            <div class="research-entry">
              <p>${entry.text}</p>
              <p class="citation">Source: ${formatCitation(entry.bibliography, citationStyle)}</p>
            </div>
          `).join('')}
        
        ${point.children.map((subPoint, subIndex) => `
          <h3>${String.fromCharCode(97 + subIndex)}. ${subPoint.text}</h3>
          ${researchEntries
            .filter(entry => entry.pointId === subPoint.id)
            .map(entry => `
              <div class="research-entry">
                <p>${entry.text}</p>
                <p class="citation">Source: ${formatCitation(entry.bibliography, citationStyle)}</p>
              </div>
            `).join('')}
        `).join('')}
      `).join('')}
      
      <div class="bibliography">
        <h2>Bibliography</h2>
        ${[...new Set(researchEntries.map(entry =>
              formatCitation(entry.bibliography, citationStyle)
            ))]
        .sort()
        .map(citation => `<p class="bibliography-entry">${citation}</p>`)
        .join('')}
      </div>
    </body>
    </html>
  `;

    const blob = new Blob([content], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research-paper.doc';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper function for source type fields
  const getSourceTypeFields = (sourceType: SourceType) => {
    const commonFields: Array<{ key: BibEntryKey; label: string; required: boolean }> = [
      { key: 'author', label: 'Author(s) (Last Name, First Name)', required: true },
      { key: 'title', label: 'Title', required: true },
      { key: 'year', label: 'Year', required: true },
      { key: 'doi', label: 'DOI (if available)', required: false }
    ];

    const sourceTypeFields: Record<SourceType, Array<{ key: BibEntryKey; label: string; required: boolean }>> = {
      book: [
        { key: 'publisher', label: 'Publisher', required: true },
        { key: 'city', label: 'City of Publication', required: true },
        { key: 'edition', label: 'Edition', required: false }
      ],
      journal: [
        { key: 'journalName', label: 'Journal Name', required: true },
        { key: 'volume', label: 'Volume', required: true },
        { key: 'issue', label: 'Issue', required: true },
        { key: 'pages', label: 'Pages', required: true }
      ],
      website: [
        { key: 'websiteName', label: 'Website Name', required: true },
        { key: 'organization', label: 'Organization', required: true },
        { key: 'url', label: 'URL', required: true },
        { key: 'accessDate', label: 'Access Date', required: true }
      ],
      newspaper: [
        { key: 'newspaperName', label: 'Newspaper Name', required: true },
        { key: 'pages', label: 'Page Numbers', required: false }
      ],
      chapter: [
        { key: 'bookTitle', label: 'Book Title', required: true },
        { key: 'editors', label: 'Editor(s)', required: true },
        { key: 'publisher', label: 'Publisher', required: true },
        { key: 'chapterPages', label: 'Chapter Pages', required: true }
      ]
    };

    return [...commonFields, ...sourceTypeFields[sourceType]];
  };

  // Return JSX continues in Part 3...

  return (
    <div className={styles.container}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6 space-x-2">
          <Coffee className="h-8 w-8 text-[#8B593E]" />
          <h1 className={`${styles.heading} text-2xl font-bold`}>Cozy Research Assistant</h1>
        </div>
        <div className="w-full max-w-xs mx-auto mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Storage Used</span>
            <span className="text-gray-600">{storagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${storagePercentage > 90
                ? 'bg-red-600'
                : storagePercentage > 75
                  ? 'bg-yellow-400'
                  : 'bg-green-600'
                }`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
        </div>
        {/* Add the warning banner here */}
        {storageWarning && (
          <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {storageWarning}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          <p className={`italic text-lg ${styles.text} whitespace-normal break-words max-w-full`}>
            {thesis || 'Enter your thesis in the Outline tab'}
          </p>
        </div>

        <Tabs defaultValue="phase1" className="w-full">
          <TabsList className={`grid w-full grid-cols-3 ${styles.tabs}`}>
            <TabsTrigger value="phase1" className={styles.tabsTrigger}>Outline</TabsTrigger>
            <TabsTrigger value="phase2" className={styles.tabsTrigger}>Research</TabsTrigger>
            <TabsTrigger value="phase3" className={styles.tabsTrigger}>Review</TabsTrigger>
          </TabsList>

          {/* Outline Tab */}
          <TabsContent value="phase1">
            <Card className={styles.card}>
              <CardContent className="space-y-4 pt-6">
                <Input
                  placeholder="Enter thesis statement"
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  className={styles.input}
                />

                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter outline point"
                    value={currentPointText}
                    onChange={(e) => setCurrentPointText(e.target.value)}
                    className={styles.input}
                  />
                  <Select
                    value={currentLevel}
                    onValueChange={(value: Level) => setCurrentLevel(value)}
                  >
                    <SelectTrigger className={`w-32 ${styles.select}`}>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="main">Main Point</SelectItem>
                      <SelectItem value="sub">Sub Point</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentLevel === 'sub' && (
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger className={`w-32 ${styles.select}`}>
                        <SelectValue placeholder="Select Main" />
                      </SelectTrigger>
                      <SelectContent className={styles.selectContent}>
                        {outlinePoints.map((point, index) => (
                          <SelectItem key={point.id} value={point.id}>
                            Main Point {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button onClick={handleAddPoint} className={styles.button}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="mt-6 space-y-2">
                  {outlinePoints.map((point, index) => (
                    <div key={point.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium flex-grow whitespace-normal break-words">
                          {index + 1}. {point.text}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => movePoint(index, 'up')}
                          disabled={index === 0}
                          className="p-1"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => movePoint(index, 'down')}
                          disabled={index === outlinePoints.length - 1}
                          className="p-1"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePoint(point.id)}
                          className={`p-1 ${styles.deleteButton}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {point.children.map((subPoint, subIndex) => (
                        <div key={subPoint.id} className="ml-6 flex items-center space-x-2">
                          <p>
                            {String.fromCharCode(97 + subIndex)}. {subPoint.text}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePoint(subPoint.id, point.id)}
                            className={`p-1 ${styles.deleteButton}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Research Tab */}
          <TabsContent value="phase2">
            <Card className={styles.card}>
              <CardContent className="space-y-4 pt-6">
                <Select onValueChange={setSelectedPointId}>
                  <SelectTrigger className={styles.select}>
                    <SelectValue placeholder="Select point for research" />
                  </SelectTrigger>
                  <SelectContent className={styles.selectContent}>
                    {outlinePoints.map((point, index) => (
                      <React.Fragment key={point.id}>
                        <SelectItem value={point.id}>Main Point {index + 1}</SelectItem>
                        {point.children.map((subPoint, subIndex) => (
                          <SelectItem key={subPoint.id} value={subPoint.id}>
                            → {String.fromCharCode(97 + subIndex)}. {subPoint.text}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Enter your research notes"
                  value={researchText}
                  onChange={(e) => setResearchText(e.target.value)}
                  className={`min-h-24 ${styles.input}`}
                />

                <div className={`space-y-4 ${styles.bibliographySection}`}>
                  <h3 className="font-semibold">Bibliography Information</h3>

                  <Select
                    value={bibEntry.sourceType}
                    onValueChange={(value: SourceType) => setBibEntry({ ...bibEntry, sourceType: value })}
                  >
                    <SelectTrigger className={styles.select}>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="journal">Journal Article</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="newspaper">Newspaper</SelectItem>
                      <SelectItem value="chapter">Book Chapter</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSourceTypeFields(bibEntry.sourceType).map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-sm text-gray-600">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.key === 'accessDate' ? (
                          <Input
                            type="date"
                            value={bibEntry[field.key]}
                            onChange={(e) => setBibEntry({ ...bibEntry, [field.key]: e.target.value })}
                            className={styles.input}
                            required={field.required}
                          />
                        ) : (
                          <Input
                            value={bibEntry[field.key]}
                            onChange={(e) => setBibEntry({ ...bibEntry, [field.key]: e.target.value })}
                            className={styles.input}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddResearch} className={`w-full ${styles.button}`}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Research Entry
                </Button>

                {selectedPointId && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">Existing Research for Selected Point</h3>
                    {researchEntries
                      .filter(entry => entry.pointId === selectedPointId)
                      .map(entry => (
                        <div key={entry.id} className="ml-4 p-4 bg-white rounded">
                          <p className="mb-2 whitespace-normal break-words">{entry.text}</p>
                          <p className="text-sm text-gray-600 whitespace-normal break-words">
                            Source: {formatCitation(entry.bibliography, citationStyle)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResearchEntries(researchEntries.filter(e => e.id !== entry.id));
                            }}
                            className={`mt-2 ${styles.deleteButton}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove Entry
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="phase3">
            <Card className={styles.card}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex space-x-4 items-center bg-white p-4 rounded-lg border border-[#D4BFA0]">
                  <Select value={citationStyle} onValueChange={(value: CitationStyle) => setCitationStyle(value)}>
                    <SelectTrigger className={`w-40 ${styles.select}`}>
                      <SelectValue placeholder="Citation Style" />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="turabian">Turabian</SelectItem>
                      <SelectItem value="apa">APA</SelectItem>
                      <SelectItem value="mla">MLA</SelectItem>
                      <SelectItem value="chicago">Chicago</SelectItem>
                      <SelectItem value="ieee">IEEE</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={handleExport} className={styles.button}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export to Word
                  </Button>
                </div>

                <div className="space-y-6">
                  {outlinePoints.map((point, index) => (
                    <div key={point.id} className="space-y-4">
                      <h2 className={`text-xl font-bold ${styles.heading} whitespace-normal break-words`}>
                        {index + 1}. {point.text}
                      </h2>

                      {researchEntries
                        .filter(entry => entry.pointId === point.id)
                        .map(entry => (
                          <div key={entry.id} className="ml-4 p-4 bg-white rounded">
                            <p className="mb-2 whitespace-normal break-words">{entry.text}</p>
                            <p className="text-sm text-gray-600 whitespace-normal break-words">
                              Source: {formatCitation(entry.bibliography, citationStyle)}
                            </p>
                          </div>
                        ))}

                      {point.children.map((subPoint, subIndex) => (
                        <div key={subPoint.id} className="ml-6 space-y-2">
                          <h3 className={`text-lg font-semibold ${styles.heading} whitespace-normal break-words`}>
                            {String.fromCharCode(97 + subIndex)}. {subPoint.text}
                          </h3>

                          {researchEntries
                            .filter(entry => entry.pointId === subPoint.id)
                            .map(entry => (
                              <div key={entry.id} className="ml-4 p-4 bg-white rounded">
                                <p className="mb-2 whitespace-normal break-words">{entry.text}</p>
                                <p className="text-sm text-gray-600 whitespace-normal break-words">
                                  Source: {formatCitation(entry.bibliography, citationStyle)}
                                </p>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResearchPaperOrganizer;