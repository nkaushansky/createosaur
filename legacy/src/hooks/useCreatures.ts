import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { CreatureService, DatabaseCreature } from '@/services/creatureService'

export const useCreatures = () => {
  const { user } = useAuth()
  const [creatures, setCreatures] = useState<DatabaseCreature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean
    migratedCount: number
  }>({ completed: false, migratedCount: 0 })

  // Load creatures when user changes
  useEffect(() => {
    if (user) {
      loadUserCreatures()
      performMigrationIfNeeded()
    } else {
      // User signed out, clear creatures
      setCreatures([])
      setLoading(false)
    }
  }, [user])

  const loadUserCreatures = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const userCreatures = await CreatureService.getUserCreatures(user.id)
      setCreatures(userCreatures)
    } catch (err: any) {
      console.error('Failed to load creatures:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const performMigrationIfNeeded = async () => {
    if (!user) return

    try {
      const migratedCount = await CreatureService.migrateLocalStorageCreatures(user.id)
      setMigrationStatus({ completed: true, migratedCount })
      
      if (migratedCount > 0) {
        // Reload creatures after migration
        await loadUserCreatures()
      }
    } catch (err) {
      console.error('Migration failed:', err)
    }
  }

  const saveCreature = async (creatureData: {
    name: string
    image_url?: string
    generation_params: any
    traits: any
    is_favorite?: boolean
    is_public?: boolean
    rating?: number
  }) => {
    if (!user) {
      setError('You must be signed in to save creatures')
      return null
    }

    try {
      setError(null)
      const newCreature = await CreatureService.saveCreature(user.id, creatureData)
      setCreatures(prev => [newCreature, ...prev])
      return newCreature
    } catch (err: any) {
      console.error('Failed to save creature:', err)
      setError(err.message)
      return null
    }
  }

  const deleteCreature = async (creatureId: string) => {
    try {
      setError(null)
      await CreatureService.deleteCreature(creatureId)
      setCreatures(prev => prev.filter(c => c.id !== creatureId))
    } catch (err: any) {
      console.error('Failed to delete creature:', err)
      setError(err.message)
    }
  }

  const toggleFavorite = async (creatureId: string) => {
    const creature = creatures.find(c => c.id === creatureId)
    if (!creature) return

    try {
      setError(null)
      const updatedCreature = await CreatureService.toggleFavorite(
        creatureId, 
        !creature.is_favorite
      )
      setCreatures(prev => 
        prev.map(c => c.id === creatureId ? updatedCreature : c)
      )
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err)
      setError(err.message)
    }
  }

  const updateRating = async (creatureId: string, rating: number) => {
    try {
      setError(null)
      const updatedCreature = await CreatureService.updateRating(creatureId, rating)
      setCreatures(prev => 
        prev.map(c => c.id === creatureId ? updatedCreature : c)
      )
    } catch (err: any) {
      console.error('Failed to update rating:', err)
      setError(err.message)
    }
  }

  const renameCreature = async (creatureId: string, name: string) => {
    try {
      setError(null)
      const updatedCreature = await CreatureService.renameCreature(creatureId, name)
      setCreatures(prev => 
        prev.map(c => c.id === creatureId ? updatedCreature : c)
      )
    } catch (err: any) {
      console.error('Failed to rename creature:', err)
      setError(err.message)
    }
  }

  const togglePublic = async (creatureId: string) => {
    const creature = creatures.find(c => c.id === creatureId)
    if (!creature) return

    try {
      setError(null)
      const updatedCreature = await CreatureService.togglePublic(
        creatureId, 
        !creature.is_public
      )
      setCreatures(prev => 
        prev.map(c => c.id === creatureId ? updatedCreature : c)
      )
    } catch (err: any) {
      console.error('Failed to toggle public visibility:', err)
      setError(err.message)
    }
  }

  return {
    creatures,
    loading,
    error,
    migrationStatus,
    actions: {
      loadUserCreatures,
      saveCreature,
      deleteCreature,
      toggleFavorite,
      updateRating,
      renameCreature,
      togglePublic
    }
  }
}