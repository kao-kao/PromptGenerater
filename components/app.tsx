'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ClipboardCopy, Plus, Edit, Trash2, Wand2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Theme インターフェースの定義
interface Theme {
  id: number;
  name: string;
  fields: string[];
  promptTemplate: string;
}

export function App() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddThemeDialogOpen, setIsAddThemeDialogOpen] = useState(false);
  const [isEditThemeDialogOpen, setIsEditThemeDialogOpen] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: "", fields: ["", "", ""], promptTemplate: "" });
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("generate")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('*')
        if (error) throw error
        setThemes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "テーマの読み込み中にエラーが発生しました。")
      }
    }

    loadThemes()
  }, [])

  const handleThemeChange = (themeId: string) => {
    try {
      const theme = themes.find(t => t.id === parseInt(themeId))
      if (!theme) throw new Error("選択されたテーマが見つかりません。")
      setSelectedTheme(theme)
      setInputs({})
      setGeneratedPrompt("")
      setIsDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const generatePrompt = () => {
    try {
      if (!selectedTheme) throw new Error("テーマが選択されていません。")
      let prompt = selectedTheme.promptTemplate
      selectedTheme.fields.forEach(field => {
        if (!inputs[field]) throw new Error(`${field}が入力されていません。`)
        prompt = prompt.replace(new RegExp(`\\{${field}\\}`, 'g'), inputs[field])
      })
      setGeneratedPrompt(prompt)
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロンプトの生成中にエラーが発生しました。")
    }
  }

  const copyPrompt = () => {
    try {
      navigator.clipboard.writeText(generatedPrompt)
      // Here you could add a toast notification for copy success feedback
    } catch (err) {
      setError("プロンプトのコピーに失敗しました。")
    }
  }

  const handleAddTheme = async () => {
    try {
      if (!newTheme.name) throw new Error("テーマ名を入力してください。")
      if (newTheme.fields.some(f => !f)) throw new Error("すべてのフィールドを入力してください。")
      if (!newTheme.promptTemplate) throw new Error("プロンプトテンプレートを入力してください。")

      const { data, error } = await supabase
        .from('themes')
        .insert([
          {
            name: newTheme.name,
            fields: newTheme.fields.filter(f => f !== ""),
            prompt_template: newTheme.promptTemplate
          }
        ])
        .select()

      if (error) throw error

      setThemes([...themes, data[0]])
      setNewTheme({ name: "", fields: ["", "", ""], promptTemplate: "" })
      setIsAddThemeDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "テーマの追加中にエラーが発生しました。")
    }
  }

  const handleEditTheme = async () => {
    try {
      if (!editingTheme || !editingTheme.name) throw new Error("テーマ名を入力してください。")
      if (editingTheme.fields.some(f => !f)) throw new Error("すべてのフィールドを入力してください。")
      if (!editingTheme.promptTemplate) throw new Error("プロンプトテンプレートを入力してください。")

      const { data, error } = await supabase
        .from('themes')
        .update({
          name: editingTheme.name,
          fields: editingTheme.fields,
          prompt_template: editingTheme.promptTemplate
        })
        .eq('id', editingTheme.id)
        .select()

      if (error) throw error

      const updatedThemes = themes.map(theme => 
        theme.id === editingTheme.id ? data[0] : theme
      )
      setThemes(updatedThemes)
      setIsEditThemeDialogOpen(false)
      setEditingTheme(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "テーマの編集中にエラーが発生しました。")
    }
  }

  const handleDeleteTheme = async (themeId: number) => {
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId)

      if (error) throw error

      const updatedThemes = themes.filter(theme => theme.id !== themeId)
      setThemes(updatedThemes)
      if (selectedTheme && selectedTheme.id === themeId) {
        setSelectedTheme(null)
        setInputs({})
        setGeneratedPrompt("")
      }
    } catch (err) {
      setError("テーマの削除中にエラーが発生しました。")
    }
  }

  const handleTabChange = (value: string) => {
    if (value === "manage" && !isAuthenticated) {
      setIsPasswordDialogOpen(true)
    } else {
      setActiveTab(value)
    }
  }

  const handlePasswordSubmit = () => {
    if (password === "0411") {
      setIsAuthenticated(true)
      setActiveTab("manage")
      setIsPasswordDialogOpen(false)
    } else {
      setError("パスワードが正しくありません。")
    }
    setPassword("")
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Webプロンプト自動生成アプリ</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">プロンプト生成</TabsTrigger>
          <TabsTrigger value="manage">テーマ管理</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>プロンプト生成</CardTitle>
              <CardDescription>テーマを選択し、必要な情報を入力してプロンプトを生成します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="テーマを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id.toString()}>{theme.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTheme && (
                  <div className="space-y-4">
                    {selectedTheme.fields.map(field => (
                      <div key={field}>
                        <Label htmlFor={field} className="text-sm font-medium">{field}</Label>
                        <Input
                          id={field}
                          value={inputs[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`${field}を入力`}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={generatePrompt} className="w-full" disabled={!selectedTheme}>
                <Wand2 className="mr-2 h-4 w-4" />
                プロンプトを生成
              </Button>
            </CardFooter>
          </Card>
          {generatedPrompt && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>生成されたプロンプト</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <p className="whitespace-pre-wrap">{generatedPrompt}</p>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={copyPrompt} className="w-full">
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  コピー
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="manage">
          {isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle>テーマ管理</CardTitle>
                <CardDescription>テーマの追加、編集、削除ができます</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {themes.map(theme => (
                    <div key={theme.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="font-medium">{theme.name}</span>
                      <div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTheme(theme)
                            setIsEditThemeDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTheme(theme.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setIsAddThemeDialogOpen(true)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  新しいテーマを追加
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>アクセス制限</CardTitle>
                <CardDescription>テーマ管理にアクセスするには認証が必要です。</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddThemeDialogOpen} onOpenChange={setIsAddThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいテーマを追加</DialogTitle>
            <DialogDescription>新しいテーマの名前、入力フィールド、プロンプトテンプレートを設定してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="themeName" className="text-sm font-medium">テーマ名</Label>
              <Input
                id="themeName"
                value={newTheme.name}
                onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="テーマ名を入力"
                className="mt-1"
              />
            </div>
            {newTheme.fields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={`field${index}`} className="text-sm font-medium">フィールド {index + 1}</Label>
                <Input
                  id={`field${index}`}
                  value={field}
                  onChange={(e) => {
                    const updatedFields = [...newTheme.fields]
                    updatedFields[index] = e.target.value
                    setNewTheme(prev => ({ ...prev, fields: updatedFields }))
                  }}
                  placeholder={`フィールド ${index + 1} を入力`}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="promptTemplate" className="text-sm font-medium">プロンプトテンプレート</Label>
              <Textarea
                id="promptTemplate"
                value={newTheme.promptTemplate}
                onChange={(e) => setNewTheme(prev => ({ ...prev, promptTemplate: e.target.value }))}
                placeholder="プロンプトテンプレートを入力（フィールドは {フィールド名} の形式で指定）"
                className="mt-1 h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTheme}>テーマを追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditThemeDialogOpen} onOpenChange={setIsEditThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テーマを編集</DialogTitle>
            <DialogDescription>テーマの名前、入力フィールド、プロンプトテンプレートを編集してください</DialogDescription>
          </DialogHeader>
          {editingTheme && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editThemeName" className="text-sm font-medium">テーマ名</Label>
                <Input
                  id="editThemeName"
                  value={editingTheme.name}
                  onChange={(e) => setEditingTheme(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="テーマ名を入力"
                  className="mt-1"
                />
              </div>
              {editingTheme.fields.map((field, index) => (
                <div key={index}>
                  <Label htmlFor={`editField${index}`} className="text-sm font-medium">フィールド {index + 1}</Label>
                  <Input
                    id={`editField${index}`}
                    value={field}
                    onChange={(e) => {
                      const updatedFields = [...editingTheme.fields]
                      updatedFields[index] = e.target.value
                      setEditingTheme(prev => prev ? { ...prev, fields: updatedFields } : null)
                    }}
                    placeholder={`フィールド ${index + 1} を入力`}
                    className="mt-1"
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="editPromptTemplate" className="text-sm font-medium">プロンプトテンプレート</Label>
                <Textarea
                  id="editPromptTemplate"
                  value={editingTheme.promptTemplate}
                  onChange={(e) => setEditingTheme(prev => prev ? { ...prev, promptTemplate: e.target.value } : null)}
                  placeholder="プロンプトテンプレートを入力（フィールドは {フィールド名} の形式で指定）"
                  className="mt-1 h-32"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditTheme}>変更を保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワード認証</DialogTitle>
            <DialogDescription>テーマ管理にアクセスするにはパスワードを入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordSubmit}>認証</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}